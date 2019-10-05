<template>
	<div id="rules-graph">
		<div id="graphDiv" class="svg">
			
		</div>
		<div id="graph-options" v-if="setup">
			<b>Similarity</b>
			<table>
				<tr>
					<td>Operator</td>
					<td><select v-model="operator" class="form-control-sm">
						<option value="OR">or</option>
						<option value="AND">and</option>
					</select></td>
				</tr>
				<tr v-for="(option, name) in options" :key="name">
					<td>{{ name }}</td>
					<td><vue-slider class="slider" :silent="true" v-model="option.value" :max="option.max" :min="option.min" :interval="option.interval"/></td>
					<td><input type="number" v-model="option.value"></td>
				</tr>
				<tr v-for="(select, name) in selects" :key="name">
					<td>{{ name }}</td>
					<td><select v-model="select.value" class="form-control-sm">
						<option v-for="value in select.domain" :key="value">{{value}}</option>
					</select></td>
				</tr>
				<tr><td>Graph mode</td>
					<td><select v-model="drag" class="form-control-sm">
						<option :value="true">Drag nodes</option>
						<option :value="false">Read nodes</option>
					</select></td>
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
		</div>
	</div>
</template>

<script>
import * as d3 from "d3";
import VueSlider from 'vue-slider-component';
export default {
	name: "RulesGraph",
	props: {
		nodes: Array,
		links: Array,
		setup: Boolean,
		characteristics: Array,
	},
	data() { return {
		operator: 'AND',
		advanced: false,
		drag: true,
		options: {
			'Semantic': { value: 0.55, min: 0, max: 1, interval: 0.01},
			'Coverage': { value: 0.55, min: 0, max: 1, interval: 0.01},
		},
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
		ruleId: undefined,
	}},
	watch: {
		links: function() {this.generate();}
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
			if (this.ruleId == undefined || this.nodes == undefined) return undefined;
			return this.nodes.find(r => r.id == this.ruleId);
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

			var links = [];
			var nodesSet = new Set();
			
			var lColor = d3.scaleLinear()
				.domain([0.2, 0.6, 1])
				.range(['#ffff00', '#ff0000', '#000000']);
			var lSize = d3.scaleLinear()
				.domain([0, 0.4, 1])
				.range([1, 1, 15]);
			
			var linkSize = this.selects['Edge size'].value;
			var linkColor = this.selects['Edge color'].value;

			for (var l of this.links) {
				var c1 = l.semantic >= this.options['Semantic'].value;
				var c2 = l.coverage >= this.options['Coverage'].value;
				if (this.operator == "OR" && (c1 || c2) == false)
					continue;
				if (this.operator == "AND" && (c1 && c2) == false)
					continue;
				var size = (linkSize == 'fixed' ? 3 : lSize(l[linkSize]));
				var color = (linkColor == 'fixed' ? 'black' : lColor(l[linkColor]));
				links.push({'source': l.source, 'target': l.target, 'size': size, 'color': color});
				nodesSet.add(l.source);
				nodesSet.add(l.target);
			}
			var nodeSize = this.selects['Node size'].value;
			var nodeColor = this.selects['Node color'].value;

			if (nodeColor == 'fixed') color = undefined;
			else {
				var min = this.characteristic(nodeColor).min, max = this.characteristic(nodeColor).max;
				var color = d3.scaleLinear()
					.domain([min, (max+min)/2 , max])
					.range(['#ffffff', '#ffff00', '#ff0000']);
			}
			var nSize = (nodeSize == 'fixed' ? undefined : d3.scaleLinear()
				.domain([this.characteristic(nodeSize).min, this.characteristic(nodeSize).max])
				.range([3, 17]));
			var nodes = this.nodes.filter(n => nodesSet.has(n.id)).map(n => { return { 
				'id': n.id,
				'size': (nodeSize == 'fixed' ? 10 : 10 + nSize(n.characteristics[nodeSize])),
				'color': (nodeColor == 'fixed' ? 'orange' : color(n.characteristics[nodeColor])),
				'text': this.operatorSign(n.decisions[0][0].operator) + n.decisions[0][0].description,
				'fullText': this.conditionsToString(n.conditions),
			}});

			var transform = d3.zoomIdentity;
			var data = {}, component = this;
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
				}

				function zoomed() {
					transform = d3.event.transform;
					simulationUpdate();
				}

				function dragsubject() {
					return dragsubject2(d3.event.x, d3.event.y);
				}

				function dragsubject2(xx, yy) {
					var x = transform.invertX(xx);
					var y = transform.invertY(yy);
					for (var i = tempData.nodes.length - 1; i >= 0; --i) {
						var node = tempData.nodes[i];
						var dx = x - node.x;
						var dy = y - node.y;
						if (dx * dx + dy * dy < 100) {
							node.x =  transform.applyX(node.x);
							node.y = transform.applyY(node.y);
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
					else component.ruleId = (d3.event.subject == undefined ? component.ruleId : d3.event.subject.id);
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
}

#graphDiv {
	position: absolute;
	left: 0; top: 0; right: 0; bottom: 0;
	width: 100%; height:100%;
	overflow: hidden;
}
.form-control-sm { height: calc(1rem + 10px); padding: 0; margin-left: 10px; }  /* used by select tag */
	
</style>

