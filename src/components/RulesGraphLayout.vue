<template>
	<div id="rules-graph">
		<div id="graphDiv" class="svg">
			
		</div>
		<div id="graph-options" v-if="setup">
			<b>Similarity</b>
			<table>
				<tr>
					<td>Rules</td>
					<td>
						<input id="RGL-atleast" type="radio" :value="'L'" v-model="options.rulesType">
						<label for="RGL-atleast">at least</label>
						<input id="RGL-atmost" type="radio" :value="'M'" v-model="options.rulesType">
						<label for="RGL-atmost">at most</label>
					</td>
				</tr>
				<tr>
					<td>Operator</td>
					<td>
						<input id="RGL-or" type="radio" :value="'OR'" v-model="operator">
						<label for="RGL-or">or</label>
						<input id="RGL-and" type="radio" :value="'AND'" v-model="operator">
						<label for="RGL-and">and</label>
					</td>
				</tr>
				<tr v-for="(option, name) in options" :key="name">
					<template v-if="name == 'Coverage' || name == 'Semantic'">
						<td>{{ name }}</td>
						<td><vue-slider class="slider" :silent="true" v-model="option.value" :max="option.max" :min="option.min" :interval="option.interval"/></td>
						<td><input type="number" v-model="option.value"></td>
					</template>
				</tr>
				<tr v-for="(select, name) in selects" :key="name">
					<td>{{ name }}</td>
					<td><select v-model="select.value" class="form-control-sm" @change="update">
						<option v-for="value in select.domain" :key="value">{{value}}</option>
					</select></td>
				</tr>
				<tr><td>Graph mode</td>
					<td>
						<input type="radio" id="drag-mode" :value="true" v-model="drag">
						<label for="drag-mode"><span>Drag</span></label>
						<input type="radio" id="read-mode" :value="false" v-model="drag">
						<label for="read-mode">Read</label>
					</td>
				</tr>
			</table>
			<div>
				<button @click="generate" class="btn btn-sm btn-success">Refresh</button>
				<input type="checkbox" v-model="advanced">
				<label>Physics</label>
			</div>
			<table v-if="advanced">
				<tr v-for="(option, name) in parameters" :key="name">
					<td>{{ name }}</td>
					<td><input type="number" v-model="option.value">
					<td><vue-slider class="slider" :silent="true" v-model="option.value" :max="option.max" :min="option.min" :interval="option.interval"/></td>
				</tr>
			</table>
		</div>
		<div id="graph-rule">
			<table class="table-sm" v-if="rule != undefined"><tr>
				<td>{{ rule.id }}</td>
				<td @click="setRule(rule.id)" class="condition" v-html="conditionsToString(rule.conditions)"></td>
			</tr><tr>
				<td></td>
				<td v-html="decisionsToString(rule.decisions)"></td>
			</tr></table>
			<img v-else width="25px" src="/img/help.png" alt="help icon" data-toggle="tooltip" 
				:title="'Click on node in Read mode to display detail informations about node.'">
		</div>
	</div>
</template>

<script>
import * as d3 from "d3";
import VueSlider from 'vue-slider-component';
export default {
	name: "RulesGraphLayout",
	props: {
		nodes: Array,
		links: Array,
		rules: Array,
		setup: Boolean,
		characteristics: Array,
		options: Object
	},
	data() { return {
		updateStyle: function() {},
		simulationUpdate: function() {},
		operator: 'AND',
		advanced: false,
		drag: true,
		parameters: {
			'Center': { value: 0.1, min: 0, max: 1, interval: 0.01},
			'Collide': { value: 0.1, min: 0, max: 1, interval: 0.01},
			'Collide radius': { value: 100, min: 0, max: 200, interval: 1},
			'Link': { value: 1, min: 0, max: 5, interval: 0.1},
			'Link distance': { value: 25, min: 0, max: 100, interval: 1},
			'Charge': { value: -50, min: -100, max: 0, interval: 1},
			'Charge theta': { value: 1, min: 0, max: 10, interval: 0.1},
			'Iterations': { value: 300, min: 40, max: 1000, interval: 1},
		},
	}},
	watch: {
		links: function() {this.generate();},
	},
	computed: {
		alphaDecay() { return Math.pow(0.001, 1 / this.parameters['Iterations'].value); },
		characteristicsNames() { return this.characteristics.map(c => c.name); },
		selects() {
			return {
				'Node size': { domain: ['fixed'].concat(this.characteristicsNames), value: 'fixed' },
				'Node color': { domain: ['fixed'].concat(this.characteristicsNames), value: 'fixed' },
				'Edge size': { domain: ['fixed', 'semantic', 'coverage'], value: 'semantic' },
				'Edge color': { domain: ['fixed', 'semantic', 'coverage'], value: 'coverage' },
			}
		},
		rule() {
			if (this.options.ruleId == undefined || this.nodes == undefined) return undefined;
			return this.nodes.find(r => r.id == this.options.ruleId);
		}
	},
	mounted() {
		// var observer = new ResizeObserver(this.resize);
		// observer.observe(document.getElementById('graphDiv'));
	},
	components: {
		VueSlider
	},
	methods: {
		update() {
			this.updateStyle();
			this.simulationUpdate();
		},
		conditionsToString(conditions) {
			var result = "", joinSign = (this.multiLine ? '\n' : ', ');
			for (var condition of conditions) {
				result += joinSign + condition.name + " " + this.operatorSign(condition.operator) + " " 
						+ "<span class=\"rule-value\">" + condition.description + "</span>";
			}
			return result.substr(1);
		},
		decisionsToString(decisions) {
			var decision = decisions[0][0];
			return decision.name + " " + this.operatorSign(decision.operator) + " " 
						+ "<span class=\"rule-value\">" + decision.description + "</span>";
		},
		operatorSign(op) {
			var f = {">=": "\u2265", "<=": "\u2264", "==": "="};
			return f[op] || op;
		},
		characteristic(name) {
			return this.characteristics.find(c => c.name == name);
		},
		drop() {
			d3.select("#graphDiv").select("canvas").remove();
		},
		generate() {
			this.drop();
			if (this.links.length == 0) return;

			var height = screen.height;
			var graphWidth =  screen.width;
			var component = this;

			var graphCanvas = d3.select('#graphDiv')
				.append('canvas')
				.attr('width', graphWidth)
				.attr('height', height)
				.node();
			

			var context = graphCanvas.getContext('2d');
			context.fillStyle = "blue";
			context.fillRect(0, 0, graphCanvas.width, graphCanvas.height);
			context.fill();

			var simulation = d3.forceSimulation()
				.force("center", d3.forceCenter(graphWidth / 2 - 200, height / 2 - 200))
				.force("x", d3.forceX(graphWidth / 2)
					.strength(this.parameters['Center'].value))
				.force("y", d3.forceY(height / 2)
					.strength(this.parameters['Center'].value))
				.force("charge", d3.forceManyBody()
					.strength(this.parameters['Charge'].value)
					.theta(this.parameters['Charge theta'].value)
				)
				.force("link", d3.forceLink()
					.strength(this.parameters['Link'].value)
					.distance(this.parameters['Link distance'].value)
					.id(function(d) { return d.id; })
				)
				.force('collide', d3.forceCollide()
					.radius(this.parameters['Collide radius'].value)
					.strength(this.parameters['Collide'].value)
				)
				.alphaDecay(this.alphaDecay)
				.alphaTarget(0.3);

			var nodesSet = new Set();
			var links = [];
			var rulesSet = new Set(this.rules.map(r => r.id));

			for (var l of this.links) {
				var c1 = (l.semantic >= this.options['Semantic'].value);
				var c2 = (l.coverage >= this.options['Coverage'].value);
				if (this.operator == "OR" && (c1 || c2) == false)
					continue;
				if (this.operator == "AND" && (c1 && c2) == false)
					continue;
				if (!rulesSet.has(l.source) || !rulesSet.has(l.target))
					continue;
				links.push({'source': l.source, 'target': l.target, 'ref': l});
				nodesSet.add(l.source);
				nodesSet.add(l.target);
			}
			var nodes = this.nodes.filter(n => nodesSet.has(n.id)).map(n => { return { 
				'id': n.id,
				'ref': n,
				'text': this.operatorSign(n.decisions[0][0].operator) + n.decisions[0][0].description,
				'fullText': this.conditionsToString(n.conditions),
			}});

			function updateStyle() {
				var nodeSize = component.selects['Node size'].value;
				var nodeColor = component.selects['Node color'].value;
				var linkSize = component.selects['Edge size'].value;
				var linkColor = component.selects['Edge color'].value;

				var lColor = d3.scaleLinear()
					.domain([0.2, 0.6, 1])
					.range(['#ffff00', '#ff0000', '#000000']);
				var lSize = d3.scaleLinear()
					.domain([0, 0.4, 1])
					.range([1, 1, 15]);
				var nColor = undefined;
				if (nodeColor != 'fixed') {
					var min = component.characteristic(nodeColor).min, max = component.characteristic(nodeColor).max;
					nColor = d3.scaleLinear()
						.domain([min, (max+min)/2 , max])
						.range(['#ffffff', '#ffff00', '#ff0000']);
				}
				var nSize = (nodeSize == 'fixed' ? undefined : d3.scaleLinear()
					.domain([component.characteristic(nodeSize).min, component.characteristic(nodeSize).max])
					.range([3, 17]));

				for (var l of links) {
					l.size = (linkSize == 'fixed' ? 3 : lSize(l.ref[linkSize]));
					l.color = (linkColor == 'fixed' ? 'black' : lColor(l.ref[linkColor]));
				}
				for (var n of nodes) {
					n.size = (nodeSize == 'fixed' ? 10 : 10 + nSize(n.ref.characteristics[nodeSize]));
					n.color = (nodeColor == 'fixed' ? 'orange' : nColor(n.ref.characteristics[nodeColor]));
				}
			}
			this.updateStyle = updateStyle;
			updateStyle();

			var transform = d3.zoomIdentity;
			var data = {};
			data.nodes = nodes;
			data.edges = links;
			initGraph(data);  
			
			simulation.restart();
			setTimeout( () => simulation.stop(), 1500);

			function initGraph(tempData){
				d3.select(graphCanvas)
					.call(d3.drag().subject(dragsubject).on("start", dragstarted).on("drag", dragged).on("end",dragended))
					.call(d3.zoom().scaleExtent([1 / 10, 8]).on("zoom", zoomed));
					
				simulation.nodes(tempData.nodes)
						.on("tick",simulationUpdate);

				simulation.force("link")
						.links(tempData.edges);

				function simulationUpdate() {
					context.save();

					context.clearRect(0, 0, graphWidth, height);
					context.translate(transform.x, transform.y);
					context.scale(transform.k, transform.k);

					tempData.edges.forEach(function(d) {
						context.beginPath();
						context.moveTo(d.source.x, d.source.y);
						context.lineTo(d.target.x, d.target.y);
						context.lineWidth = d.size;
						context.strokeStyle = d.color;
						context.stroke();
					});
					// Draw the nodes
					tempData.nodes.forEach(function(d, i) {
						context.beginPath();
						context.arc(d.x, d.y, d.size, 0, 2 * Math.PI, true);
						context.fillStyle = d.color;
						context.lineWidth = 2;
						context.strokeStyle = "black";
						context.stroke();
						context.fill();
						context.beginPath();
						context.textAlign = 'center';
						context.textBaseline = 'middle';
						context.fillStyle = "black";
						context.font = "15px Georgia";
						context.fillText(d.text, d.x, d.y);
						context.fill();
					});

					context.restore();
				};
				component.simulationUpdate = simulationUpdate;

				function zoomed() {
					transform = d3.event.transform;
					simulationUpdate();
				}

				function dragsubject() {
					var x = transform.invertX(d3.event.x);
					var y = transform.invertY(d3.event.y);
					var node = getsubject(x, y);
					if (component.drag && node != undefined) {
						node.x =  transform.applyX(node.x);
						node.y = transform.applyY(node.y);
					}
					return node;
				}

				function getsubject(x, y) {
					for (var i = tempData.nodes.length - 1; i >= 0; --i) {
						var node = tempData.nodes[i];
						var dx = x - node.x;
						var dy = y - node.y;
						if (dx * dx + dy * dy < 100) {
							return node;
						}
					}
				}
				function dragstarted() {
					if (component.drag) {
						if (!d3.event.active) simulation.alphaTarget(0.3).restart();
						d3.event.subject.fx = transform.invertX(d3.event.x);
						d3.event.subject.fy = transform.invertY(d3.event.y);
					}
					else component.options.ruleId = (d3.event.subject == undefined ? component.options.ruleId : d3.event.subject.id);
				}
				function dragged() {
					if (!component.drag) return;
					d3.event.subject.fx = transform.invertX(d3.event.x);
					d3.event.subject.fy = transform.invertY(d3.event.y);
				}
				function dragended() {
					if (!component.drag) return;
					if (!d3.event.active) simulation.alphaTarget(0);
					d3.event.subject.fx = null;
					d3.event.subject.fy = null;
				}
				function render(){ }
			}
		}
	},
}
</script>

<style scoped>
#rules-graph {
	flex: 1;
	position: relative;
}
#graph-options {
	position: absolute;
	left: 0; top: 0;
	display: flex;
	flex-direction: column;
	background-color: white;
}
#graph-options > div {
	flex: -1;
	display: flex;
	flex-direction: row;
	align-items: center;
}
input[type=radio] { margin-left: 10px; vertical-align: middle;}
#graph-options input[type=checkbox] {
	margin-left: 10px;
	height: 20px;
	width: 20px;
}
#graph-options input[type=number] {
	width: 50px;
}
.slider {
	width: 100px !important;
	margin: 0 10px !important;
}
#graph-rule {
	left: 280px;
	position: absolute;
	top: 0;
	background-color: white;
}

#graphDiv {
	position: absolute;
	left: 0; top: 0; right: 0; bottom: 0;
	width: 100%; height:100%;
	overflow: hidden;
}
.form-control-sm { height: calc(1rem + 10px); padding: 0; margin-left: 10px; }  /* used by select tag */
	
</style>

