# Chemistry extension for Numbas

Provides data and functions to make calculations in chemistry easier.

Functions and data are being added as needed.

This has been written by a non-chemist, in collaboration with some non-coding chemists.

## JME functions

### `atom(symbol, [mass number])` or `atom(atomic number, [mass number])`

Construct an atom of the element with the given symbol or atomic number.
Give `mass number` to specify a particular isotope.

**Example:**

* `atom("Na")`
* `atom("Na",19)`
* `atom(11)

### `name(atom)`

The IUPAC name of the atom, with the mass number appended if it's a particular isotope.

**Examples:**

* `name(atom("Na"))` → `"sodium"`
* `name(atom("Na",19))` → `"sodium-19"`

### `symbol(atom)`

The symbol of the atom.

**Example:**

* `symbol(atom(11))` → `"Na"`

### `string(atom)`

A plaintext string representation of the atom. For isotopes, the mass number is shown in superscript.

**Example:**

* `string(atom("Na",19))` → `"¹⁹Na"`

### `atom[property]`

Get the given property of the atom, from the `periodic_table_data` or `isotope_data` dictionaries.

**Examples:**

* `atom("Na")["electronegativity"]` → `0.93`
* `atom("C",13)["Isotopic Composition"]` → `"0.0107(8)"`

### `atomic_number(atom)`

The atomic number of the atom.

**Example:**

* `atomic_number(atom("C"))` → `6`

### `mass_number(atom)`

The mass number of the given atom. If no isotope is specified, the most abundant isotope is used.

**Example:**

* `mass_number(atom("Na"))` → `23`

### `neutrons(atom)`

The number of neutrons in the atom Equivalent to `mass_number(atom) - atomic_number(atom)`.

**Example:**

* `neutrons(atom("Na"))` → `12`

### `relative_mass(atom)`

The relative atomic mass of the atom. If no isotope is specified, the standard atomic weight is used.

**Example:**

* `relative_mass(atom("C"))` → `12.0107`

### `isotopes(atom)`

List the mass number of known isotopes of the element.

**Example:**

* `isotopes(atom("H"))` → `[ 1, 2, 3, 4, 5, 6, 7 ]`

### `abundance(atom)`

Abundance of the given isotope. If no isotope specified, returns `1`.

**Example:**

* `abundance(atom("C",13))` → `0.0107`

### `formula(string)`

Construct a compound from the given formula.

**Examples:**

* `formula("H2O")`
* `formula("C(CH3)4")
* `formula("2(N2)")

### `string(formula)`

A plain text display representation of the given formula.

**Example:**

* `string(formula("H2O"))` → `"H₂O"`

### `plain_string(formula)`

A plain text display representation of the given formula.

**Example:**

* `string(formula("H2O"))` → `"H₂O"`

### `atom_counts(formula)`

Returns a dictionary containing the number of atoms of each element present in the compound.

**Example:** 

* `atom_counts(formula("C(CH3)4"))` → `[ "C": 5, "H": 12 ]`

### `mass(formula)`

The relative atomic mass of the compound specified by the formula.

**Example:**

* `mass(formula("C(CH3)4"))` → `72.14878`

### `thermodynamic_data(name,state)`

Returns data from the `thermodynamic_data` dictionary for the chemical with the given name or symbol, in the given state.
Common values of `state` are `"g"` (gas), `"l"` (liquid), "c" (crystalline), or `"amorphous"`. Some other states are also listed; see `thermodynamic_data`.

## Data

Some data sets are available as variables.

### `periodic_table`

Based on [https://github.com/andrejewski/periodic-table](https://github.com/andrejewski/periodic-table), which is itself based on [https://web.archive.org/web/20161203095654/http://php.scripts.psu.edu/djh300/cmpsc221/p3s11-pt-data.htm](https://web.archive.org/web/20161203095654/http://php.scripts.psu.edu/djh300/cmpsc221/p3s11-pt-data.htm).

A list of dictionaries providing data on elements in the periodic table.
`periodic_table[n]` give data for the element with atomic number `n`.

Each dictionary has the following keys:

* `atomicNumber`
* `symbol`
* `name`
* `atomicMass` - Standard atomic weight, with precision (e.g. "1.00794(4)")
* `cpkHexColor` - Hex representation of the element's [CPK colour](https://en.wikipedia.org/wiki/CPK_coloring)
* `electronicConfiguration` - [Electron configuration](https://en.wikipedia.org/wiki/Electron_configuration)
* `electronegativity` - Pauling electronegativity
* `atomicRadius` - Atomic radius in pm
* `ionRadius` - Ion radius in pm
* `vanDerWaalsRadius` - van der Waals radius in pm
* `ionizationEnergy` - IE<sup>-1</sup> in kJ/mol
* `electronAffinity` - EA in kJ/mol
* `oxidationStates` - Oxidation states
* `standardState` - Standard state, one of `"gas"`, `"solid"`, `"liquid"` or `""`
* `bondingType` - Bonding type, one of `"diatomic"`, `"atomic"`, `"metallic"`, `"covalent network"` or `""`
* `meltingPoint` - Melting point in K
* `boilingPoint` - Boiling point in K
* `density` - Density in g/mL
* `groupBlock` - Group, one of `"nonmetal"`, `"noble gas"`, `"alkali metal"`, `"alkaline earth metal"`, `"metalloid"`, `"halogen"`, `"metal"`, `"transition metal"`, `"lanthanoid"`, `"actinoid"`, `"post-transition metal"`
* `yearDiscovered`

### `isotope_data`

Based on [https://www.nist.gov/pml/atomic-weights-and-isotopic-compositions-relative-atomic-masses](https://www.nist.gov/pml/atomic-weights-and-isotopic-compositions-relative-atomic-masses)

Data on properties of isotopes. A dictionary of the form `{atomic_number: {mass_number: data}}`.

Each dictionary has the following keys:

* `"Isotopic Composition"` - Abundance of this isotope as a proportion between 0 and 1, with precision (e.g. `"0.524(1)"`)
* `"Notes"` - See the [NIST column description](https://www.nist.gov/pml/atomic-weights-and-isotopic-compositions-column-descriptions#notes)
* `"Standard Atomic Weight"` - Standard atomic weight of the element, with precision
* `"Atomic Number"`
* `"Atomic Symbol"`
* `"Relative Atomic Mass"` - Relative atomic mass of this isotope
* `"Mass Number`

### `thermodynamic_data`

Based on Newcastle University's thermodynamic data card.

Data on thermodynamic properties of some chemicals in different states. Most easily accessed with `thermodynamic_data(name,state)`.

A list of dictionaries with the following keys:

* `"name"`
* `"formula"`
* `"state"` 
* `"Hfg"` - Enthalpy of formation, in kJ/mol
* `"Gfg"` - Gibbs free energy, in kJ/mol
* `"Smg"` - Entropy, in J/mol/K
* `"Cpm"` - Specific heat capacity, in J/mol/K
