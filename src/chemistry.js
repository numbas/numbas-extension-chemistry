/** Parse a number with uncertainty attached, e.g. 0.0005(2).
 * The bit in brackets shows the uncertainty in the last digit - in the example above, the number is +/- 0.0002.
 */
function parse_uncertain_number(str) {
    return parseFloat(str.replace(/\(.*\)$/,''));
}

function encode_number(digit_glyphs) {
    return function(n) {
        return (n+'').replace(/\d/g,function(d){ d=parseInt(d); return digit_glyphs[d]; });
    }
}
var superscript = encode_number('⁰¹²³⁴⁵⁶⁷⁸⁹');
var subscript = encode_number('₀₁₂₃₄₅₆₇₈₉');

Numbas.addExtension('chemistry',['math','jme','jme-display'],function(chemistry) {
    var jme = Numbas.jme;

    var types = chemistry.types = {};

    chemistry.isotope_data = isotope_data;
    chemistry.periodic_table_data = periodic_table_data;
    chemistry.thermodynamic_data = thermodynamic_data;

    /** Get data corresponding to an element with the given symbol
     * @param {String} symbol
     * @returns {periodic_table_data}
     */
    var element_with_symbol = chemistry.element_with_symbol = function(symbol) {
        return periodic_table_data.find(function(d) { return d.symbol == symbol; });
    }

    /** Get data corresponding to an element with the given name
     * @param {String} name
     * @returns {periodic_table_data}
     */
    var element_with_name = chemistry.element_with_name = function(name) {
        return periodic_table_data.find(function(d) { return d.name.toLowerCase() == name.toLowerCase(); });
    }

    /** Get data corresponding to an element with the given atomic number
     * @param {Number} number
     * @returns {periodic_table_data}
     */
    var element_by_number = chemistry.element_by_number = function(number) {
        return periodic_table_data.find(function(d) { return d.atomicNumber == number; });
    }

    /** Get data corresponding to a particular isotope
     * @param {Number} atomic_number
     * @param {Number} mass_number
     * @returns {isotope_data}
     */
    var get_isotope = chemistry.get_isotope = function(atomic_number,mass_number) {
        var atom = isotope_data[atomic_number];
        if(!atom) {
            throw(new Error("No data for atom number "+atomic_number));
        }
        if(mass_number===undefined) {
            var sorted_by_abundance = Object.values(atom).sort(function(a,b) {
                a = a['Isotopic Composition'];
                b = b['Isotopic Composition'];
                if(!a || !b) {
                    return a=='' ? b=='' ? 0 : 1 : -1;
                }
                a = parse_uncertain_number(a);
                b = parse_uncertain_number(b);
                return a>b ? -1 : a<b ? 1 : 0;
            });
            var most_common = sorted_by_abundance[0];
            return most_common;
        } else {
            var isotope = atom[mass_number];
            if(!isotope) {
                throw(new Error("No data for isotope of atom number "+atomic_number+" with mass number "+mass_number));
            }
            return isotope;
        }
    }

    /** Representation of an isotope of a particular element
     * @param {periodic_table_data} data
     * @param {isotope_data} [isotope] - if not given, the most common isotope will be used
     */
    var Atom = chemistry.Atom = function(data,isotope) {
        this.data = data;
        this.symbol = this.data.symbol;
        this.atomic_number = data.atomicNumber;
        this.isotope = get_isotope(this.atomic_number,isotope);
        this.isotope_specified = isotope!==undefined;
        this.mass_number = this.isotope['Mass Number'];
        this.relative_atomic_mass = parse_uncertain_number(this.isotope_specified ? this.isotope['Relative Atomic Mass'] : this.data.atomicMass);
    }
    Atom.prototype = {
        /** An English name for the atom
         * @returns {String}
         */
        name: function() {
            var name = this.data.name.toLowerCase();
            if(this.isotope_specified) {
                name += '-'+this.mass_number;
            }
            return name;
        },

        /** Mass numbers of common isotopes of this element
         * @returns {Array.<Number>}
         */
        isotopes: function() {
            return Object.keys(isotope_data[this.atomic_number]).map(function(m){return parseInt(m)});
        },

        /** A TeX representation of this atom.
         * If no isotope was specified, just the symbol is returned
         * @returns {TeX}
         */
        tex: function() {
            if(this.isotope_specified) {
                return '{}^{'+this.mass_number+'} \\mathrm{'+this.symbol+'}';
            } else {
                return '\\mathrm{'+this.symbol+'}';
            }
        },
        /** JME representation of this atom.
         * @returns {JME}
         */
        jme: function() {
            if(this.isotope_specified) {
                return 'atom("'+this.symbol+'",'+this.mass_number+')';
            } else {
                return 'atom("'+this.symbol+'")';
            }
        },
        /** String representation of this atom. If a mass number was specified, it's included as a superscript.
         * @returns {String}
         */
        string: function() {
            if(this.isotope_specified) {
                return superscript(this.mass_number)+this.symbol;
            } else {
                return this.symbol;
            }
        },
        /** Relative abundance of this isotope. 
         * If no isotope was specified, returns 1.
         * @returns {Number}
         */
        abundance: function() {
            if(this.isotope_specified) {
                return parse_uncertain_number(this.isotope['Isotopic Composition'] || '0');
            } else {
                return 1;
            }
        }
    }

    var TAtom = types.TAtom = function(atom) {
        this.value = atom;
    }
    TAtom.prototype = {
        type: 'atom',
    }

    jme.display.typeToTeX.atom = function(thing,tok,texArgs,settings) {
        return tok.value.tex();
    }
    jme.display.typeToJME.atom = function(tree,tok,bits,settings) {
        return tok.value.jme();
    }

    /** A chemical formula.
     * @see parse_formula
     */
    function Formula(formula) {
        this.formula = formula;
    }
    Formula.prototype = {
        tex: function() {
            return formula_to_tex(this.formula);
        },
        jme: function() {
            return 'formula("'+Numbas.jme.escape(formula_to_string(this.formula))+'")';
        },
        plain_string: function() {
            return formula_to_string(this.formula);
        },
        string: function() {
            return display_formula(this.formula);
        },
        atom_counts: function() {
            return count_atoms(this.formula);
        },
        mass: function() {
            var t = 0;
            Object.entries(this.atom_counts()).forEach(function(c) {
                var symbol = c[0];
                var n = c[1];
                var atom = element_with_symbol(symbol);
                if(!atom) {
                    throw(new Error("Unknown element symbol "+symbol));
                }
                var atomicMass = parse_uncertain_number(atom.atomicMass);
                t += n * atomicMass;
            });
            return t;
        }
    }

    var TFormula = types.TFormula = function(formula) {
        this.value = formula;
    }
    TFormula.prototype = {
        type: 'chemical_formula'
    }

    jme.display.typeToTeX.chemical_formula = function(thing,tok,texArgs,settings) {
        return tok.value.tex();
    }
    jme.display.typeToJME.chemical_formula = function(tree,tok,bits,settings) {
        return tok.value.jme();
    }

	var funcObj = jme.funcObj;
	var TString = jme.types.TString;
	var TNum = jme.types.TNum;
	var TList = jme.types.TList;
	var TBool = jme.types.TBool;
    var TDict = jme.types.TDict;

    function addFunction(name,deps,outtype,fn,options) {
        var a = chemistry.scope.addFunction(new funcObj(name,deps,outtype,fn,options));
    };

    chemistry.scope.setVariable('periodic_table',jme.wrapValue([null].concat(periodic_table_data)));
    chemistry.scope.setVariable('isotope_data',jme.wrapValue(isotope_data));
    chemistry.scope.setVariable('thermodynamic_data',jme.wrapValue(thermodynamic_data));

    addFunction('atom',[TString],TAtom,function(name) {
        var data = element_with_symbol(name) || element_with_name(name);
        return new Atom(data);
    });
    addFunction('atom',[TNum],TAtom,function(number) {
        return new Atom(element_by_number(number));
    });
    addFunction('atom',[TString,TNum],TAtom,function(name,isotope) {
        var data = element_with_symbol(name) || element_with_name(name);
        return new Atom(data,isotope);
    });
    addFunction('atom',[TNum,TNum],TAtom,function(number,isotope) {
        return new Atom(element_by_number(number,isotope));
    });
    addFunction('name',[TAtom],TString,function(atom) {
        return atom.name();
    });
    addFunction('symbol',[TAtom],TString,function(atom) {
        return atom.symbol;
    });
    addFunction('string',[TAtom],TString,function(atom) {
        return atom.string();
    });
    addFunction('listval',[TAtom,TString],'?',function(atom,key) {
        return atom.data[key] || atom.isotope[key];
    },{unwrapValues:true});
    addFunction('atomic_number',[TAtom],TNum,function(atom) {
        return atom.atomic_number;
    });
    addFunction('mass_number',[TAtom],TNum,function(atom) {
        return atom.mass_number;
    });
    addFunction('neutrons',[TAtom],TNum,function(atom) {
        return atom.mass_number - atom.atomic_number;
    });
    addFunction('relative_mass',[TAtom],TNum,function(atom) {
        return atom.relative_atomic_mass;
    });
    addFunction('isotopes',[TAtom],TList,function(atom) {
        return atom.isotopes().map(function(m){return new TNum(m)});
    });
    addFunction('abundance',[TAtom],TNum,function(atom) {
        return atom.abundance();
    });

    addFunction('formula',[TString],TFormula,function(str) {
        return new Formula(parse_formula(str));
    });

    addFunction('string',[TFormula],TString,function(formula) {
        return formula.string();
    });
    addFunction('plain_string',[TFormula],TString,function(formula) {
        return formula.plain_string();
    });

    addFunction('atom_counts',[TFormula],TDict,function(formula) {
        return jme.wrapValue(formula.atom_counts());
    },{unwrapValues:true});

    addFunction('mass',[TFormula],TNum,function(formula) {
        return formula.mass();
    })

    addFunction('thermodynamic_data',[TString,TString],TDict,function(name,state) {
        var data = thermodynamic_data.find(function(d) {
            return (d.name==name || d.formula==name) && d.state==state;
        })
        return jme.wrapValue(data);
    },{unwrapValues: true});
});
