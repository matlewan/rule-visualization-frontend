<template>
<div id="statistics-wrapper" class="scrollbar">
	<div class="statistics-panel">
		<button class="btn btn-sm btn-info" @click="compute">Recompute</button>
		<table class="table table-sm" v-if="stats != undefined">
			<tr><td>Rules</td><td>{{ stats.count }}</td></tr>
			<tr><td>Conditions per rule</td><td>{{ parseFloat((stats.conditions / stats.count).toPrecision(3)) }}</td></tr>
		</table>
		<div class="options">
			<b>Top attributes</b>
			<img width="25px" src="/img/help.png" alt="help icon" data-toggle="tooltip" :title="tooltipMsg">
			<select class="form-control-sm" v-model="attributeMode" >
				<option v-for="mode in attributeModes" :value="mode.value" :key="mode.value">{{mode.name}}</option>
			</select>
		</div>
		<div class="scrollbar"><table class="table table-sm" v-if="stats != undefined">
			<template v-for="(value, name) in topAttributes">
				<tr v-if="value.count > 0" :key="name">
					<td @click="attributeName = name" class="pointer">{{ name }}</td>
					<td class="nobreak" v-if="attributeMode == 'count'">
						{{ value.count + ' (' + parseFloat((100 * value.count / stats.count).toPrecision(3)) + '%)' }}
					</td>
					<td v-if="attributeMode == 'count2'">
						{{ parseFloat((value.count2 * stats.count / (stats.characteristics['Strength'])).toPrecision(3)) }}
					</td>
				</tr>
			</template>
		</table></div>
		<b>Average characteristics</b>
		<div class="scrollbar"><table class="table table-sm" v-if="stats != undefined">
			<template v-for="(value, name) in stats.characteristics">
				<tr v-if="characteristics[name].active" :key="name">
					<td @click="characteristicName = name" class="pointer">{{ name }}</td>
					<td>{{ parseFloat((value / stats.count).toPrecision(3)) }}</td>
				</tr>
			</template>
		</table></div>
	</div>
	<div class="statistics-panel">
		<div class="scrollbar" v-if="this.attributeName != ''">
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
		<div v-if="this.attributeName != ''">
			<b>Domain of {{ this.attributeName }}</b>
			<BaseChart v-if="attribute != undefined && attribute.domain != undefined" :data="crossPoints" :height="300" :width="400"></BaseChart>
			<Histogram v-else :data="points" :height="300" :width="400" :divClass="'attribute-histogram'"></Histogram>
		</div>
		<div v-if="rulesCharacteristics.length > 0 && characteristicName != ''" class="histogram-wrapper scrollbar">
			<b>Histogram of {{characteristicName}}</b><br>
			<label>Buckets</label><input type="number" v-model.number="histogramBuckets">
			<Histogram :data="rulesCharacteristics" :height="300" :buckets="histogramBuckets" :divClass="'characteristic-histogram'"></Histogram>
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
	  stats: {},
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
		topAttributes: function() {
			if (this.stats == undefined || this.stats.attributes == undefined) return undefined;
			var myObj = this.stats.attributes;
			return Object.keys(myObj).sort((a, b) => myObj[b][this.attributeMode]-myObj[a][this.attributeMode])
				.reduce((_sortedObj, key) => ({
				..._sortedObj, 
				[key]: myObj[key]
				}), {});	
		},
		points: function() {
			if (this.attribute == undefined) return [];
			var conditions = this.rules.map(r => r.conditions).reduce( (c1,c2) => c1.concat(c2), []).filter(c => c.name == this.attribute.name)
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
		rulesCharacteristics: function() {
			return this.rules.map(r => r.characteristics[this.characteristicName]).filter(v => v != "undefined");
		}
  },
  watch: {
	  rules: function() { this.compute(); }
  },
  methods: {
	newStats() {
		var stats = ({ count: 0, conditions: 0, 
			attributes: {}, characteristics: {} 
		});
		for (var name in this.characteristics)
			stats.characteristics[name] = 0;
		for (var a of this.attributes)
			stats.attributes[a.name] = {count: 0, count2: 0};
		return stats;
	},
	operator(op) {
		var f = {">=": "\u2265", "<=": "\u2264", "==": "="};
		return f[op] || op;
	},
	compute() {
		var stats = this.newStats();
		for (var rule of this.rules) {
			stats.count += 1;
			stats.conditions += rule.conditions.length;
			for (var cKey in rule.characteristics) {
				if (this.characteristics[cKey] == undefined) continue;
				stats.characteristics[cKey] += rule.characteristics[cKey];
			}
			for (var c of rule.conditions) {
				stats.attributes[c.name].count += 1;
				stats.attributes[c.name].count2 += (rule.characteristics['Strength'] || 1);
			}
		}
		Vue.set(this, 'stats', stats);
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
	flex: -1;
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
