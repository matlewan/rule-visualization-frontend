<template>
  <div id="app" class="container">
    <!-- <img alt="Vue logo" src="./assets/logo.png" /> -->
    <div class="tabs">
        <a @click="activetab=1" :class="[ activetab === 1 ? 'active' : '' ]">Setup</a>
        <a @click="activetab=2" :class="[ activetab === 2 ? 'active' : '' ]">Data</a>
        <a @click="activetab=3" :class="[ activetab === 3 ? 'active' : '' ]">Statistics</a>
        <a @click="activetab=4" :class="[ activetab === 4 ? 'active' : '' ]">Visualization</a>
		<div v-if="activetab > 1"><input type="checkbox" v-model="showFilter"><label>Filter</label></div>
		<div v-if="activetab == 4"><input type="checkbox" v-model="visualization"><label>Setup visualization</label></div>
    </div>
    <div id="app-content"><div>
        <FormLoader v-show="activetab==1"></FormLoader>
		<FilterTab  v-show="showFilter && activetab != 1" @apply="filterRules" @match="match" @setRule="setRule" 
					:examples="examples" :filteredExamples="filteredExamples" :characteristics="characteristics" :attributes="attributes" 
					:ruleId="ruleId" :status="status">
		</FilterTab>
		<TableTab  	v-show="activetab==2" @setRule="setRule" :rules="rules" :characteristics="characteristics"></TableTab>
		<Statistics ref="statistics" v-show="activetab==3" :attributes="attributes" :characteristics="characteristics" :rules="rules"></Statistics>
		<TheVisualization v-show="activetab==4" :attributes="activeConditionAttributes" :characteristics="characteristics" :rules="rules" :setup="visualization"></TheVisualization>
    </div></div>
  </div>
</template>

<script>
import FormLoader from "./components/FormLoader.vue";
import FilterTab from "./components/FilterTab.vue";
import TableTab from  "./components/TableTab.vue";
import Statistics from  "./components/Statistics.vue";
import TheVisualization from  "./components/TheVisualization.vue";

export default {
  name: "app",
  data() { return {
      activetab: 1,
	  showFilter: true,
	  srcRules: [],
	  rules: [],
	  filteredRules: [],
	  attributes: [],
	  statistics: {},
      characteristics: {},
	  examples: [],
	  example: undefined,
	  ruleId: undefined,
	  visualization: true
  }},
  methods: {
    load(a, r, c, e) {
        window.app = this;
        this.attributes = a;
        this.srcRules = r;
		this.rules = this.filteredRules = Object.assign([], [...this.srcRules]);
		this.characteristics = c;
		this.examples = e;
	}, 
	filterRules(evt, input) {
		var filter = {}
		filter.attributes = [];
		for (var a of this.attributes) {
			var range = a.filter.range;
			if (a.filter.op != '' || (a.preferenceType == 'none' && range.length > 0) || 
			(a.preferenceType != 'none' && (range[0] > a.min || range[1] < a.max))) {
				filter.attributes[a.name] = a;
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
	}, 
	filterRule(rule, filter) {
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
			if (attributes.find(a => a.name == attr.name) == undefined)
				count -= 1;
		}
		if (filter.join == 'AND' && count < filter.attributesIn.length) return false;
		if (filter.join == 'OR'  && filter.attributesIn.length > 0 && count == 0) return false;

		// Filter exclude
		for (var a of attributes) {
			if (filter.attributesOut.find(attr => attr.name == a.name) != undefined) return false;
		}
		
		// Filter characteristics
		for (var name of filter.chNames) {
			var value = rule.characteristics[name];
			var range = filter.characteristics[name].range;
			if (value < range[0] || value > range[1])
				return false;
		}
		return true;
	}, 
	match(evt, data) {
		this.example = data.example;
		if (data.example != undefined) {
			this.rules = Object.assign([], this.filteredRules.filter(rule => this.matchRule(data.example, rule)));
		}
		else this.rules = this.filteredRules;
	}, 
	setRule(evt, id) { 
		this.ruleId = id; 
	}, 
	matchRule(example, rule) {
		if (example.__rules == undefined) return false;
		else return example.__rules.indexOf(rule.id-1) >= 0;
	},
  },
  components: {
    FormLoader, FilterTab, TableTab, Statistics, TheVisualization
  },
  computed: {
	filteredExamples: function(ruleId) {
		if (this.ruleId == undefined)
			return this.examples;
		var rule = this.srcRules[this.ruleId-1]; 
		return this.examples.filter(e => this.matchRule(e, rule));
	},
	status: function() { return {
		filter: this.srcRules.length != this.filteredRules.length,
		match: this.filteredRules.length != this.rules.length
	}},
	activeAttributes: function() {
		return this.attributes.filter(a => a.active);
	},
	activeConditionAttributes() {
		return this.activeAttributes.filter(a => a.type == 'condition')
	}
  }
};

</script>

<style>
/* Vue default and reset */
#app { font-family: "Avenir", Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-align: center; color: #2c3e50; }
* { box-sizing: border-box; margin: 0; padding: 0; text-align: left; }

/* Main div */
#app {  
	min-width: 420px !important;
	width: 100% !important;
	max-width: 100% !important;
	min-height: 100vh !important;
	margin: 0 !important;
	padding: 0 0 5px 15px !important;
	font-size: 0.9em;
	display: flex;
	flex-direction: column;
}
#app-content {
	position: relative;
	flex: 1;
}
#app-content > div { 
	position: absolute; top: 0; left: 0; right: 0; bottom: 0;
	height: 100%;
	display: flex;
	flex-direction: row;
}

/* Cards/tabs menu */
.tabs {
	display: flex;
	flex-direction: row;
	margin: 0 20px 5px 0;
	padding-left: 10px;
	border-bottom: 1px #ccc solid;
	align-items: center;
}
.tabs a{
	padding: 4px 24px;
	cursor: pointer; border: 1px solid #ccc; border-left: none; border-bottom: none; background-color: #f1f1f1; font-weight: bold;
}
.tabs > div { margin-left: 20px; }
.tabs > div * { vertical-align: middle; }
.tabs input { height: 20px; width: 20px; margin: 0 5px 0 20px;}
.tabs label { margin: 0 5px 0 5px; font-size: 14px; font-weight: bold; }
.tabs ul { list-style-type: none; margin-left: 20px; }
.tabs a:first-child { border-left: 1px solid #ccc; }
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
label { margin-bottom: 0 !important; }

</style>
