<template>
	<div>
		<form style="max-width: 500px;">
			<div class="form-group">
				<input type="file" class="file" id="attributes" style="display: none;" @change="setAttributes" />
				<div class="input-group col-xs-12">
					<button class="browse btn-sm btn-secondary input" type="button" @click="browseAttributes" >Browse</button>
					<input id="attributesText" type="text" class="form-control-sm input" disabled placeholder="Attributes (JSON)" />
				</div>
			</div>
			<div class="form-group">
				<input type="file" class="file" id="rules" style="display: none;" @change="setRules" />
				<div class="input-group col-xs-12">
					<button class="browse btn-sm btn-secondary input" type="button" @click="browseRules">Browse</button>
					<input id="rulesText" type="text" class="form-control-sm input" disabled placeholder="Rules (XML)" />
				</div>
			</div>
			<div class="form-group">
				<input type="file" class="file" id="examples" style="display: none;" @change="setExamples" />
				<div class="input-group col-xs-12">
					<button class="browse btn-sm btn-secondary input" type="button" @click="browseExamples">Browse</button>
					<input id="examplesText" type="text" class="form-control-sm input" disabled placeholder="Examples (JSON)" />
				</div>
			</div>
		</form>
		<span style="white-space: pre;">{{ loadMsg }}</span>
		<br />
		<button class="btn btn-sm btn-success" @click="load">Load</button>
		<button class="btn btn-sm btn-info" @click="loadDemo">Load demo</button>
		<button class="btn btn-sm btn-secondary" v-if="attributes.length > 0" @click="downloadDemo">Download demo</button>
		<label>Demo: </label>
		<select v-model="demoFolder" class="form-control-sm">
			<option value="prioritisation">Prioritisation</option>
			<option value="windsor">Windsor</option>
		</select>
		<a id="download" style="display:none;"></a>
		<div class="tabs" v-if="attributes.length > 0">
			<a @click="activetab=1" :class="[ activetab === 1 ? 'active' : '' ]">Attributes</a>
			<a @click="activetab=2" :class="[ activetab === 2 ? 'active' : '' ]">Characteristics</a>
		</div>
		<div class="content" v-if="attributes.length > 0">
			<Attributes class="tab-content" v-show="activetab==1" :attributes="attributes"></Attributes>
			<Characteristics class="tab-content" v-show="activetab==2" :characteristics="characteristics"></Characteristics>
		</div>
	</div>
</template>

<script>
import Attributes from "./Attributes.vue";
import Characteristics from "./Characteristics.vue";

export default {
	name: "FormLoader",
	data() {
		return {
			loadMsg: "",
			activetab: 1,
			files: {},
			demoFolder: 'prioritisation',
		};
	},
	methods: { 
		setAttributes, setRules, setExamples, browseAttributes, browseRules, browseExamples, 
		submit, loadDemo, downloadExamples, downloadDemo, update, getExamplesBlob, load, preprocessing
	},
	components: { Attributes, Characteristics },
	computed: {
		attributes: function() { return this.$parent.attributes; },
		characteristics: function() { return this.$parent.characteristics; },
		examples: function() { return this.$parent.examples; }
	},
	mounted: function() {
		this.$root.$on('updateExamples', () => { this.update(); }); 
		this.$root.$on('downloadExamples', () => { this.downloadExamples(); }); 
	}
};
var tmp_filename;
function getAPI() { return '/api/upload' }

function download(href, filename) {
	var a = document.getElementById("download");
	a.href = href;
	a.target = "_self";
	a.download = filename;
	a.click();
}
function downloadDemo() { download('./data/' + this.demoFolder + '/data.zip', this.demoFolder + '.zip'); }
function downloadExamples() { download(URL.createObjectURL(this.getExamplesBlob()), 'examples.json'); }

function getExamplesBlob(e) {
	var replacer = function(key, value) {
		var keysToOmit = ["__idx", "__rules"];
		if (keysToOmit.indexOf(key) === -1) {
			return value;
		}
	};
	var data = JSON.stringify(e || this.examples, replacer, 2);
	return new Blob([data], { type: "text/json" });
}

function browseAttributes() { document.getElementById("attributes").click(); }
function browseRules() { document.getElementById("rules").click(); }
function browseExamples() { document.getElementById("examples").click(); }
function setAttributes() {
	var file = document.getElementById("attributes").files[0];
	document.getElementById("attributesText").value = file.name;
}
function setRules() {
	var file = document.getElementById("rules").files[0];
	document.getElementById("rulesText").value = file.name;
	tmp_filename = file.name;
}
function setExamples() {
	var file = document.getElementById("examples").files[0];
	document.getElementById("examplesText").value = file.name;
}

function receive(data) {
	if (data.status == 404) {
		throw "Server API not found (HTTP 404) on " + data.url;
	} else if (data.status != 200) {
		throw "HTTP " + data.status + ": " + data.statusText + " (" + data.url + ")";
	}
	return data.json();
}

function update() {
	var component = this;
	var dirtyExamples = this.examples.filter(e => e.__rules == undefined);
	var files = {
		attributes: this.files.attributes,
		rules: this.files.rules,
		examples: this.getExamplesBlob(dirtyExamples)
	};
	this.submit(files).then(function(data) {
		loadMatching(dirtyExamples, data.examples);
		component.$root.$emit('updateExamples-ok');
		var d = new Date(), time = [d.getHours(), d.getMinutes(), d.getSeconds()].map(v => (v < 10) ? '0'+v : v).join(':');
		component.loadMsg = "Current file: " + (tmp_filename == undefined ? 'Demo' : tmp_filename) + "        " +  time;
		component.files = files;
	}).catch(function(msg) {
		component.loadMsg = msg;
	});
}

function loadDemo() {
	var load = this.load;
	var path = '/data/' + this.demoFolder + '/';
	tmp_filename = undefined;
	var getFile = function(url) {
		return fetch(url, { method: "GET" })
		.then(response => response.blob()) 
	}
	var getFiles = function() { return Promise.all([ // waits for all fetches from server
		getFile(path + "attributes.json"), 
		getFile(path + "rules.xml"), 
		getFile(path + "examples.json")
	]); };
	getFiles().then( ([a, r, e]) => {
		load({attributes: a, rules: r, examples: e});
	});
}

function load(files) { // Performs asynchronous operations (read JSON, fetch) and then run preprocessing
	if (files.attributes == undefined) {
		files.attributes = document.getElementById("attributes").files[0],
		files.rules = document.getElementById("rules").files[0],
		files.examples = document.getElementById("examples").files[0] || new Blob(['[]'])
	}
	if (files.attributes == undefined || files.rules == undefined) {
		alert("Select attributes and rules files from your filesystem\nor click 'Load demo' button.");
		return;
	}

	var attributes = [], examples = [], component = this;
	var reader = new FileReader(), reader2 = new FileReader();
	reader.onload = function() {
		attributes = JSON.parse(reader.result);
		reader2.onload = function() {
			examples = JSON.parse(reader2.result);
			component.submit(files, component).then(function(data) {
				component.preprocessing(attributes, examples, data.rules, data.examples);
				component.files = files;
			});
		}
		reader2.readAsText(files.examples);
	};
	reader.readAsText(files.attributes);
}

function submit(files, component) {
	var formData = new FormData();
	formData.append("attributes", files.attributes);
	formData.append("rules", files.rules);
	formData.append("examples", files.examples);
	return fetch(getAPI(), { method: "POST", body: formData })
		.then(response => receive(response))
		.catch(function(msg) { component.loadMsg = msg; })
}	

function preprocessing(attributes, examples, rules, matchings) { // initial operations on loaded data
	loadAttributes(attributes);
	loadExamples(examples);
	loadMatching(examples, matchings); // should be after loadExamples
	loadRules(rules);
	var characteristics = {};
	loadCharacteristics(characteristics, rules); // should be after loadRules
	loadAttributesMinMaxRange(attributes, rules); // should be after loadRules

	this.$parent.load(attributes, rules, characteristics, examples);
	var d = new Date(), time = [d.getHours(), d.getMinutes(), d.getSeconds()].map(v => (v < 10) ? '0'+v : v).join(':');
	this.loadMsg = "Current file: " + (tmp_filename == undefined ? 'Demo' : tmp_filename) + "        " +  time;
}

function loadExamples(data) {
	for (var i = 0; i < data.length; i++) {
		data[i]["__idx"] = i + 1;
	}
}
function loadMatching(examples, pairs) {
	for (var i = 0; i < examples.length; i++) {
		examples[i].__rules = pairs[i].rules;
	}
}
function loadRules(data) {
	for (var i = 0; i < data.length; i++) {
		data[i].id = i + 1;
	}
}

function loadAttributes(data) {
	if (data.find(a => ['__idx', '__rules'].indexOf(a.name) >= 0)) {
		alert('Attributes: __idx and __rules are used within application\nfor identifying and matching objects.\nChange your data to prevent errors.');
	}
	for (var [i, attr] of data.entries()) {
		attr.id = i + 1;
		attr.dispName = attr.name;
		attr.example = attr.active;
		attr.dispFilter = attr.active && attr.valueType != undefined;
		attr.min = 0;
		attr.max = (attr.domain == undefined) ? 100 : attr.domain.length - 1;
		attr.intervals = (attr.domain == undefined) ? 20 : (attr.domain.length-1);
		Vue.set(attr, "filter", {
			include: undefined,
			op: "",
			range: attr.preferenceType != "none" ? [attr.min, attr.max] : []
		});
	}
	data.sort((a, b) => a.active > b.active || (a.active == b.active && a.name < b.name) ? -1 : 1 );
}

function isNumeric(n) { 
	try {
		return !isNaN(parseFloat(n)) && isFinite(n);
	} catch(e) {
		console.log(n);
	}
}

function loadAttributesMinMaxRange(attributes, rules) {
	var allConditions = [];
	for (var rule of rules)
		allConditions.push(...rule.conditions, ...rule.decisions.flat());
	
	var numericAttributes = attributes.filter(a => a.active && a.domain == undefined && a.identifierType == undefined);
	var numericAttributesNames = numericAttributes.map(a => a.name);
	allConditions = allConditions.filter(c => isNumeric(c.value) && (numericAttributesNames.indexOf(c.name) >= 0));

	for (var a of numericAttributes) {
		var values = allConditions.filter(c => c.name == a.name).map(c => c.value);
		a.min = Math.min(...values);
		a.max = Math.max(...values);
		Vue.set(a.filter, 'range', [a.min, a.max]);
	}
}

function loadCharacteristics(characteristics, rules) {
	var unknown = "undefined"; // must be the same identifier as in the rules.json file returned from server
	for (var rule of rules) {
		for (var name in rule.characteristics) {
			var value = rule.characteristics[name];
			if (value == unknown) continue;
			else if (characteristics[name] == undefined) {
				characteristics[name] = { range: [value, value] };
			} else {
				var range = characteristics[name].range;
				range[0] = Math.min(range[0], value);
				range[1] = Math.max(range[1], value);
			}
		}
	}
	for (name in characteristics) {
		var c = characteristics[name];
		c.name = name;
		Vue.set(c, 'dispName', name);
		c.active = c.range[0] != c.range[1];
		c.filter = c.active;
		c.display = c.active;
		c.range[0] = Math.floor(c.range[0] * 1000) / 1000;
		c.range[1] = Math.ceil(c.range[1] * 1000) / 1000;
		c.min = c.range[0] > 0 ? 0 : (c.range[0] > -1) ? -1 : Math.floor(c.range[0]);
		c.max = c.range[1] < 1 ? 1 : Math.ceil(c.range[1].toPrecision(2));
		c.intervals = 20;
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.form-group { margin-bottom: 5px; width: 400px; }
.tabs { margin-top: 10px; }
.btn { margin-right: 10px; }
.form-control-sm { width: 330px; }
select.form-control-sm { width: 110px; padding-left: 0; margin-left: 10px;}
</style>
