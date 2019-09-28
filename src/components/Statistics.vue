<template>
<div id="statistics-wrapper" class="scrollbar">
	<div class="statistics-panel">
		<button class="btn btn-sm btn-info" @click="compute">Recompute</button>
		<!-- <div class="options">
			<b>Union</b>
			<select class="form-control-sm" v-model="unionName">
				<option v-for="name in Object.keys(unions)" :value="name" :key="name">{{name}}</option>
			</select>
		</div> -->
		<table class="table table-sm" v-if="union != undefined">
			<tr><td>Rules</td><td>{{ union.count }}</td></tr>
			<tr><td>Conditions per rule</td><td>{{ parseFloat((union.conditions / union.count).toPrecision(3)) }}</td></tr>
		</table>
		<div class="options">
			<b>Top attributes</b>
			<img width="25px" src="/help.png" alt="help icon" data-toggle="tooltip" :title="tooltipMsg">
			<select class="form-control-sm" v-model="attributeMode" >
				<option v-for="mode in attributeModes" :value="mode.value" :key="mode.value">{{mode.name}}</option>
			</select>
		</div>
		<div class="scrollbar"><table class="table table-sm" v-if="union != undefined">
			<template v-for="(value, name) in topAttributes">
				<tr v-if="value.count > 0" :key="name">
					<td @click="attributeName = name" class="pointer">{{ name }}</td>
					<td class="nobreak" v-if="attributeMode == 'count'">
						{{ value.count + ' (' + parseFloat((100 * value.count / union.count).toPrecision(3)) + '%)' }}
					</td>
					<td v-if="attributeMode == 'count2'">
						{{ parseFloat((value.count2 * union.conditions / (union.count * union.characteristics['Strength'])).toPrecision(3)) }}
					</td>
				</tr>
			</template>
		</table></div>
		<b>Average characteristics</b>
		<div class="scrollbar"><table class="table table-sm" v-if="union != undefined">
			<template v-for="(value, name) in union.characteristics">
				<tr v-if="characteristics[name].active" :key="name">
					<td @click="characteristicName = name" class="pointer">{{ name }}</td>
					<td>{{ parseFloat((value / union.count).toPrecision(3)) }}</td>
				</tr>
			</template>
		</table></div>
	</div>
	<div class="statistics-panel">
		<div class="scrollbar" v-if="union != undefined && this.attributeName != ''">
			<b>Domain</b>
			<table class="table table-sm">
				<tr v-for="point in crossPoints" :key="point.value">
						<td>{{ point.count }}</td>
						<td>{{ point.value }}</td>
				</tr>
			</table>
		</div>
	</div>
	<div class="statistics-panel">
		<div v-if="union != undefined && this.attributeName != ''">
			<b>Domain of {{ this.attributeName }}</b>
			<BaseChart v-if="attribute != undefined && attribute.domain != undefined" :data="crossPoints" :height="300" :width="400"></BaseChart>
			<Histogram v-else :data="points" :height="300" :width="400"></Histogram>
		</div>
		<div v-if="unionCharacteristics.length > 0 && characteristicName != ''" class="histogram-wrapper scrollbar">
			<b>Histogram of {{characteristicName}}</b><br>
			<label>Buckets</label><input type="number" v-model.number="histogramBuckets">
			<Histogram :data="unionCharacteristics" :height="300" :buckets="histogramBuckets"></Histogram>
		</div>
	</div>
	<div></div>
</div>

</template>

<script>
import Histogram from './Histogram.vue';
import BaseChart from './BaseChart.vue';

export default {
  name: "Statistics",
  data() { return {
	  unions: {},
	  unionName: 'all',
	  attributeName: '',
	  characteristicName: '',
	  attributeMode: 'count',
	  attributeModes: [
		  {name: ' by count', value: 'count'},
		  {name: ' by importance', value: 'count2'}
	  ],
	  histogramBuckets: 10,
	  tooltipMsg: 'Count mode: occurences of every attribute\nImportance mode: every occurence is multiplied\nby rule strength and normalized by average rule strength'
  }},
  props: {
	  attributes: Array,
	  rules: Array,
	  characteristics: Object
  },
  computed: {
	  	attribute: function() {
			return this.attributes.find(a => a.name == this.attributeName);
		},
		union: function() {
			return this.unions[this.unionName];
		},
		unionRules: function() {
			return this.unionName == 'all' ? this.rules : this.rules.filter(r => {
				var d = r.decisions[0][0], union = this.union;
				if (d.name != union.name || d.operator != union.operator) return false;
				else if (union.operator == ">=" && union.value > d.value) return false;
				else if (union.operator == "<=" && union.value < d.value) return false;
				else if (union.operator != ">=" && union.operator != "<=") return (union.value == d.value);
				else return true;
			});
		},
		topAttributes: function() {
			var myObj = this.union.attributes;
			return Object.keys(myObj).sort((a, b) => myObj[b][this.attributeMode]-myObj[a][this.attributeMode])
				.reduce((_sortedObj, key) => ({
				..._sortedObj, 
				[key]: myObj[key]
				}), {});	
		},
		points: function() {
			if (this.attribute == undefined) return [];
			var conditions = this.unionRules.map(r => r.conditions).reduce( (c1,c2) => c1.concat(c2), []).filter(c => c.name == this.attribute.name)
			return conditions.sort( (a,b) => a.value - b.value).map(c => c.description).filter(v => v != undefined);
		},
		crossPoints: function() {
			var group = {}, groups = [];
			for (var point of this.points) {
				if (group.value == point)
					group.count += 1;
				else {
					group = { value: point, count: 1 };
					groups.push(group);
				}
			}
			return groups.sort( (a,b) => a.value - b.value );
		},
		unionCharacteristics: function() {
			return this.unionRules.map(r => r.characteristics[this.characteristicName]).filter(v => v != "undefined");
		}
  },
  watch: {
	  rules: function() { this.compute(); }
  },
  methods: {
	newUnion(d) {
		var union = ({ name: d.name, operator: d.operator, value: d.value, description: d.description,
			count: 0, conditions: 0, 
			attributes: {}, characteristics: {} 
		});
		for (var name in this.characteristics)
			union.characteristics[name] = 0;
		for (var a of this.attributes)
			union.attributes[a.name] = {count: 0, count2: 0};
		return union;
	},
	add(union, oldUnion) {   // result in union
		union.count += oldUnion.count;
		union.conditions += oldUnion.conditions
		for (var cKey in union.characteristics)
			union.characteristics[cKey] += oldUnion.characteristics[cKey];
		for (var aKey in union.attributes) {
			union.attributes[aKey].count += oldUnion.attributes[aKey].count;
			union.attributes[aKey].count2 += oldUnion.attributes[aKey].count2;
		}
	},
	merge(unions, keys) { // unions should be sorted
		var oldUnion = this.newUnion({});
		for (var u of keys) {
			this.add(unions[u], oldUnion);
			oldUnion = unions[u];
		}
	},
	operator(op) {
		var f = {">=": "\u2265", "<=": "\u2264", "==": "="};
		return f[op] || op;
	},
	compute() {
		var union, unions = {};
		for (var rule of this.rules) {
			var d = rule.decisions[0][0], u = d.name + ' ' + this.operator(d.operator) + ' ' + d.description;
			union = unions[u] = (unions[u] || this.newUnion(d));
			union.count += 1;
			union.conditions += rule.conditions.length;
			for (var cKey in rule.characteristics) {
				if (this.characteristics[cKey] == undefined) continue;
				union.characteristics[cKey] += rule.characteristics[cKey];
			}
			for (var c of rule.conditions) {
				union.attributes[c.name].count += 1;
				union.attributes[c.name].count2 += (union.characteristics['Strength'] == undefined ? 1 : union.characteristics['Strength'])
			}
		}
		
		var all = this.newUnion({name: 'all', operator: '', description: ''});
		for (var u in unions)
			this.add(all, unions[u]);
		var upUnions = Object.keys(unions).filter(u => unions[u].operator === ">=").sort( (a,b) => unions[b].value - unions[a].value );
		var downUnions = Object.keys(unions).filter(u => unions[u].operator === "<=").sort( (a,b) => unions[a].value - unions[b].value );
		this.merge(unions, upUnions);
		this.merge(unions, downUnions);
		unions['all'] = all;

		Vue.set(this, 'unions', unions);
	}
  },
	components: {
		Histogram, BaseChart
	}
};

// hello();
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#statistics-wrapper {
	min-height: 0px;
	margin-right: 10px;
	display: flex;
	flex-direction: row;
	width: 100%;
}
.statistics-panel:first-child { margin-left: 0; flex: -1 }
.statistics-panel:nth-child(2) { flex: -2 }
.statistics-panel:last-child {flex: 2}
.statistics-panel {
	display: flex;
	flex-direction: column;
	height: 100%;
	flex: 0;
	margin-left: 17px;
}
.statistics-panel > .scrollbar {
	overflow: auto;
	min-height: 0px;
	flex: -1;
}
.statistics-panel:nth-child(2) > .scrollbar {
	flex: -2;
}
.statistics-panel > .options {
	margin-top: 5px;
	display: flex;
	flex-direction: row;
	align-items: center;
}
.statistics-panel > .options > select {
	margin-left: 10px;
	flex: 1;
}
.form-control-sm { height: calc(1rem + 10px); padding: 0; }  /* used by select tag */    
.pointer { cursor: pointer;}
.histogram-wrapper input {width: 50px; margin-left: 15px;}
.nobreak { white-space: nowrap;}
.crossPoints { position: relative; }
.crossPoints > .scrollbar {overflow: auto; min-height: 0px; flex: -1}
</style>
