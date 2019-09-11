<template>
  <div id="app" class="container">
    <!-- <img alt="Vue logo" src="./assets/logo.png" /> -->
    <div class="tabs">
        <a @click="activetab=1" :class="[ activetab === 1 ? 'active' : '' ]">Setup</a>
        <a @click="activetab=2" :class="[ activetab === 2 ? 'active' : '' ]">Data</a>
        <a @click="activetab=3" :class="[ activetab === 3 ? 'active' : '' ]">Statistics</a>
        <a @click="activetab=4" :class="[ activetab === 4 ? 'active' : '' ]">Visualization</a>
    </div>
    <div class="content">
        <FormLoader class='tab-content' v-show="activetab==1"></FormLoader>
        <FilterTab  @apply="filterRules" @match="match" @setRule="setRule" class='tab-content' v-show="activetab==2" 
                    :srcExamples="srcExamples" :examples="examples" :characteristics="characteristics" :attributes="attributes" 
					:ruleId="ruleId" :status="status">
        </FilterTab>
        <TableTab  	@setRule="setRule" class='tab-content' v-show="activetab==2" 
					:rules="rules" :characteristics="characteristics"></TableTab>
		<Statistics :attributes="attributes" :characteristics="characteristics" :rules="srcRules" v-show="activetab==3"></Statistics>
        <div style="clear:both;"></div>
    </div>
  </div>
</template>

<script>
import FormLoader from "./components/FormLoader.vue";
import FilterTab from "./components/FilterTab.vue";
import TableTab from  "./components/TableTab.vue";
import Statistics from  "./components/Statistics.vue";

export default {
  name: "app",
  data() { return {
      activetab: 1,
	  srcRules: [],
	  rules: [],
	  filteredRules: [],
      attributes: [],
      characteristics: { },
	  srcExamples: [],
	  example: undefined,
	  ruleId: undefined
  }},
  methods: {
    loadExamples(e) { this.srcExamples = e; },
    load(a, r, c) {
        window.app = this;
        this.attributes = a;
        this.srcRules = r;
		this.rules = this.filteredRules = Object.assign([], [...this.srcRules]);
		this.characteristics = c;
    }, filterRules, filterRule, match, setRule, matchRule
  },
  components: {
    FormLoader, FilterTab, TableTab, Statistics
  },
  computed: {
	examples: function(ruleId) {
		if (this.ruleId == undefined)
			return this.srcExamples;
		var rule = this.srcRules[this.ruleId-1]; 
		return this.srcExamples.filter(e => matchRule(e, rule));
	},
	status: function() { return {
		filter: this.srcRules.length != this.filteredRules.length,
		match: this.filteredRules.length != this.rules.length
	}}
	  
  }
};

function setRule(evt, id) { this.ruleId = id; }

function filterRules(evt, input) {
    var filter = {}
	filter.attributes = [];
	for (var a of this.attributes) {
		var range = a.filter.range;
		if (a.filter.op != '' || (a.preferenceType == 'none' && range.length > 0) || 
		   (a.preferenceType != 'none' && (range[0] > a.min || range[1] < a.max))) {
			   filter.attributes[a.srcName] = a;
		}
	}
	filter.join = input.aOperator;
	filter.attributesIn = this.attributes.filter(a => a.filter.include == true);
	filter.attributesOut = this.attributes.filter(a => a.filter.include == false);
	filter.characteristics = this.characteristics;
	filter.chNames = Object.keys(filter.characteristics).filter(function(name) {
        var c = filter.characteristics[name];
        return (c.range[0] > c.min || c.range[1] < c.max);
    });

	this.rules = this.filteredRules = Object.assign([], this.srcRules.filter(rule => this.filterRule(rule, filter)));  
	this.match(evt, { example: this.example});
}
function filterRule(rule, filter) {
	// Filter operators and ranges
	var attributes = [].concat(...rule.decisions).concat(rule.conditions); // decisions + conditions of rule
	attributes = attributes.filter(function(a) {
		var fAttribute = filter.attributes[a.name];
		if (fAttribute == undefined) return true;
		var aFilter = fAttribute.filter;
		if (aFilter.op != '' && aFilter.op != a.operator) return false;
		if (fAttribute.preferenceType != 'none' && (a.value < aFilter.range[0] || a.value > aFilter.range[1])) return false;
		if (fAttribute.preferenceType == 'none' && aFilter.range.find(v => v == a.value) == undefined) return false;
		return true;
	});

	// Filter include
	var count = filter.attributesIn.length;
	for (var attr of filter.attributesIn) {
		if (attributes.find(a => a.name == attr.srcName) == undefined)
			count -= 1;
	}
	if (filter.join == 'AND' && count < filter.attributesIn.length) return false;
	if (filter.join == 'OR'  && filter.attributesIn.length > 0 && count == 0) return false;

	// Filter exclude
	for (var a of attributes) {
		if (filter.attributesOut.find(attr => attr.srcName == a.name) != undefined) return false;
	}
	
	// Filter characteristics
    for (var name of filter.chNames) {
        var value = rule.characteristics[name];
        var range = filter.characteristics[name].range;
        if (value < range[0] || value > range[1])
            return false;
    }
    return true;
}

function match(evt, data) {
	this.example = data.example;
	if (data.example != undefined) {
		this.rules = Object.assign([], this.filteredRules.filter(rule => matchRule(data.example, rule)));
	}
	else this.rules = this.filteredRules;
}

function matchRule(example, rule) {
	if (example.rules == undefined) return false;
	else return example.rules.indexOf(rule.id-1) >= 0;
}
</script>

<style>
/* Vue default and reset */
#app { font-family: "Avenir", Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-align: center; color: #2c3e50; }
* { box-sizing: border-box; margin: 0; padding: 0; text-align: left; }

/* Main div */
.container {  
	min-width: 420px;
	max-width: 100% !important;
	font-size: 0.9em;
}
.tab-content { margin-left: 10px; }

/* Cards/tabs menu */
.tabs { overflow: hidden; margin-bottom: 5px; width: 100%; }
.tabs a{
	float: left; padding: 4px 24px;
	cursor: pointer; border: 1px solid #ccc; border-right: none; background-color: #f1f1f1; font-weight: bold;
}
.tabs ul { list-style-type: none; margin-left: 20px; }
.tabs a:last-child { border-right: 1px solid #ccc; }
.tabs a:hover { background-color: #aaa; color: #fff; }
.tabs a.active { background-color: #fff; color: #484848; border-bottom: 2px solid #fff; cursor: default; }

/* Scrollbar */
.rule-table.scrollbar::-webkit-scrollbar-track { margin-top: 30px; }
.scrollbar::-webkit-scrollbar-track { -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3); box-shadow: inset 0 0 6px rgba(0,0,0,.3); background-color: #F5F5F5; }
.scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
.scrollbar::-webkit-scrollbar-thumb { background-color: #000000; border: 2px solid #555555; }

/* Other general */
input { border-radius: .2rem; border-style: solid; border-width: 1px; border-color: rgb(169,169,169); }
.table > tbody > tr > td { vertical-align: middle; }
.rule-value { text-align: right; font-weight: bold; color: #000077;}  /* for some reason not working in TableTab.vue */

</style>
