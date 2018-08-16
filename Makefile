chemistry.js: src/*.js
	@echo "(function() {" > $@
	@for file in $^; do cat $$file; done >> $@
	@echo "})();" >> $@
	@echo "Built $@"
