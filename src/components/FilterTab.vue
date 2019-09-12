<template>
<div v-if="attributes.length > 0" style="float: left;">
<div class="tabs">
	<a @click="activesubtab=1" :class="{'active': activesubtab === 1, 'status-active': status.filter}">Filter</a>
	<a @click="activesubtab=2" :class="{'active': activesubtab === 2, 'status-active': status.match}">Match</a>
</div>
<div class='tab-content' v-show="activesubtab==1">
	<template v-if="Object.keys(characteristics).length > 0">
	<h5>Characteristics</h5>
	<div class="c-filter scrollbar">
		<table class="table table-sm">
			<tbody>
				<tr v-for="(value, name) in activeCharacteristics" :key="name">
					<td><label>{{ value.dispName }}</label></td>
					<td><input type="number" v-model="value.range[0]" :step="value.step" :min="value.min" :max="value.range[1]"></td>
					<td><vue-slider class="slider" :silent="true" v-model="value.range" :max="value.max" :min="value.min" :interval="interval(value)"/></td>
					<td><input type="number" v-model="value.range[1]" :step="value.step" :min="value.range[0]" :max="value.max"></td>
				</tr>
			</tbody>
		</table>
	</div>
	</template>
	<h5>Attributes</h5>
	<input @click="checkAll" type="checkbox" name="all" id="all"><label for="all">All</label>
	<label style="margin: 0 10px 0 20px;" for="aOperator">Join operator: </label>
	<select class="form-control-sm" v-model="aOperator" name="aOperator">
		<option value="OR">or</option>
		<option value="AND">and</option>
	</select>
	<div class="a-filter scrollbar">
		<table class="table table-sm">
		<tbody>
			<tr v-for="attribute in activeAttributes" :key="attribute.id">
				<td><input type="checkbox" @click="checkOne($event.target, attribute)"></td>
				<td class="attrName"> <div>{{ attribute.dispName }} </div></td>
				<template v-if="attribute.preferenceType == 'none'">
					<td class="selected"> {{ selected(attribute) }} </td>
					<td>
						<select v-model="attribute.filter.range" multiple>
							<option class='opt' v-for="(value, index) in attribute.domain" :value="index" :key="value.id">{{ value }}</option>
						</select>
					</td>
				</template>
				<template v-else>
					<td><select v-model="attribute.filter.op" class="form-control-sm">
						<option value="">&isin;</option>
						<option value=">=">&ge;</option>
						<option value="<=">&le;</option>
					</select></td>
					<td><vue-slider class="slider" v-model="attribute.filter.range" :max="attribute.max" :min="attribute.min" :interval="interval(attribute)" 
						:tooltipPlacement="'left'" :dotSize="14" :silent="true" :tooltip-formatter="attribute.domain != undefined ? val => attribute.domain[val] : undefined"/></td>
				</template>
			</tr>
		</tbody>
		</table>
	</div>
	<button @click="reset" class="btn btn-primary">Reset</button>
	<button @click="apply" class="btn btn-success">Apply</button>
</div>
<Examples class='tab-content' v-show="activesubtab==2" :attributes="attributes" :examples="examples" :filteredExamples="filteredExamples" :ruleId="ruleId"></Examples>
</div>
</template>

<script>
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/antd.css'
import Examples from  "../components/Examples.vue";

export default {
  name: "FilterTab",
  props: {
      characteristics: Object,
      attributes: Array,
	  filteredExamples: Array,
	  examples: Array,
	  ruleId: Number,
	  status: Object
  },
  data() { return {
		activesubtab: 1,
		all: undefined,
		aOperator: "OR"
  }},
  computed: {
    activeCharacteristics: function() {
          return Object.keys(this.characteristics)
                .filter(key => this.characteristics[key].filter)
                .reduce((obj, key) => {
                    obj[key] = this.characteristics[key];
                    return obj;
                }, {});
        },
    activeAttributes: function() {
          return this.attributes.filter(a => a.dispFilter).sort( (a,b) => (a.type > b.type) ? -1 : (a.name < b.name) ? -1 : 1 );
        }
  },
  components: {
      VueSlider, Examples
  },
  methods: {
      apply, reset, resetCheckboxes, check, checkOne, checkAll, attr, selected, interval
  }
};

function interval(obj) {
	return parseFloat(((obj.max - obj.min) / (obj.intervals)).toPrecision(8));
}

function selected(attribute) {
	var elems = attribute.filter.range.map(v => attribute.domain[v]);
	if (elems.length == 0) return 'all';
	var x = elems.join(', ');
	return (x.length <= 20) ? x : '(' + elems.length + ') ' + x.substr(0, 15) + '...';
}

function apply() {
    var data = { aOperator: this.aOperator };
    this.$emit('apply', this.$event, data);
}

function attr(name) { return this.attributes.filter(a => a.name == name)[0]; }

function reset() {
    for (var name in this.characteristics) {
		var c = this.characteristics[name];
		Vue.set(c, 'range', [c.min, c.max]);
    }
    for (var a of this.activeAttributes) {
		Vue.set(a.filter, 'op', ''); 
		Vue.set(a.filter, 'range', a.preferenceType != 'none' ? [a.min, a.max] : []); 
	}
	this.resetCheckboxes();
    this.apply();
}
function resetCheckboxes() { this.all = false; this.checkAll(); }

function check(elem, value) {
	var cycle = [undefined, true, false];
	var index = cycle.indexOf(value);
	var newValue = cycle[(index+1) % cycle.length];
	elem.indeterminate = (newValue == false);
	elem.checked = (newValue == true);
	return newValue;
}
function checkOne(elem, attribute) { attribute.filter.include = this.check(elem, attribute.filter.include); }
function checkAll() {
	var elem = document.getElementById('all');
	this.all = this.check(elem, this.all);
	
	for (var a of this.attributes) { a.filter.include = this.all; }
    for (var elemA of document.querySelectorAll('.a-filter input[type="checkbox"')) {
		elemA.indeterminate = elem.indeterminate;
		elemA.checked = elem.checked;
    }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
	/* Main elements sizes */
	.a-filter { max-height: calc(100vh - 450px); }
	.c-filter { max-height: 250px; }
    .a-filter,.c-filter {
        flex-grow: 0;
        margin-right: 10px;
        margin-bottom: 5px;
        overflow: auto;
        width: 360px;
    }
	.attrName div { width: 150px; overflow-x: hidden; margin: 0; } /* Sets max width of attributes' names */
	.attrName { width: 160px; } /* Wrapper for above (width >= width of .attrName div)
    .c-filter label { max-width: 150px; } /* Sets max width of characteristics' names */


    .c-filter input,.vue-slider { position: relative; background-color: white; }
    .vue-slider { min-width: 80px; max-width: 80px; float: left;}
	input[type="number"] { width: 60px; float: left; border: 0; text-align: right; } /* vue-slider helpers */
    
    .table-sm td { padding: 0.1rem; }
    .table { margin-bottom: 0; } 
	td label { margin-top: 0.2rem; margin-bottom: 0.2rem; }


	select[multiple] { max-height: 2rem; width: 80px; }
	.selected { max-width: 45px; word-break: break-all; } /* element presenting selected options in multiple select */
    .form-control-sm { height: calc(1rem + 10px); padding: 0; }  /* used by select tag */
	.opt { padding: 0 5px; text-align: center; } /* used by option tag */

	.status-active { background-color: #fff0f0 !important;  color: #aa0000 !important; }
    .btn { margin-right: 10px; }
</style>
