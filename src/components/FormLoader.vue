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
		<button class="btn btn-sm btn-success" @click="submit">Submit</button>
		<button class="btn btn-sm btn-info" @click="loadDemo">Load demo</button>
		<button class="btn btn-sm btn-primary" v-if="dirtyExamples" @click="update">Update</button>
		<button class="btn btn-sm btn-secondary" v-if="attributes.length > 0" @click="downloadDemo">Download demo files</button>
		<button class="btn btn-sm btn-secondary" v-if="dirtyExamples" @click="downloadExamples">Download examples</button><a id="downloadExamples" style="display:none;"></a>
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
			rules: [],
			attributes: [],
			characteristics: {},
			examples: [],
			activetab: 1,
			files: {}
		};
	},
	methods: { 
		setAttributes, setRules, setExamples, browseAttributes, browseRules, browseExamples, 
		submit, loadDemo, downloadExamples, downloadDemo, update, getExamplesBlob
	},
	components: { Attributes, Characteristics },
	computed: {
		dirtyExamples: function() {
			return this.$parent.examples.length > 0;
		}
	}
};
var tmp_filename;
function getAPI() { return 'http://localhost:8081/upload' }

function update() {
	var component = this;
	var formData = new FormData();
	formData.append("attributes", this.files.attributes);
	formData.append("rules", this.files.rules);
	formData.append("examples", this.getExamplesBlob());

	fetch(getAPI(), { method: "POST", body: formData })
		.then(response => receive(response))
		.then(function(data) {
			var examples = component.$parent.srcExamples;
			for (var i = 0; i < examples.length; i++)
				Vue.set(examples[i], 'rules', data.examples[i].rules);
			var d = new Date(), time = [d.getHours(), d.getMinutes(), d.getSeconds()].map(v => (v < 10) ? '0'+v : v).join(':');
			component.loadMsg = "Current file: " + (tmp_filename == undefined ? 'Demo' : tmp_filename) + "        " +  time;
		})
		.catch(function(msg) {
			component.loadMsg = msg;
		});
}

function downloadDemo() {
	var a = document.getElementById("downloadExamples");
	a.href = './data/data.zip';
	a.target = "_self";
	a.download = 'data.zip';
	a.click();
 }

function loadAttributes(component, data) {
	for (var [i, attr] of data.entries()) {
		attr.id = i + 1;
		attr.srcName = attr.name;
		attr.example = attr.active;
		attr.active = attr.name == "ID" ? false : attr.active;
		attr.dispFilter = attr.active;
		attr.min = 0;
		attr.max = attr.domain == undefined ? 100 : attr.domain.length - 1;
		Vue.set(attr, "filter", {
			include: undefined,
			op: "",
			range: attr.preferenceType != "none" ? [attr.min, attr.max] : []
		});
	}
	component.attributes = data;
	component.attributes.sort((a, b) =>
		a.active > b.active || (a.active == b.active && a.name < b.name)
			? -1
			: 1
	);
}

function getExamplesBlob() {
	var replacer = function(key, value) {
		var keysToOmit = ["idx", "rules"];
		if (keysToOmit.indexOf(key) === -1) {
			return value;
		}
	};
	var data = JSON.stringify(this.$parent.srcExamples, replacer, 2);
	return new Blob([data], { type: "text/json" });
}

function downloadExamples() {
	var a = document.getElementById("downloadExamples");
	a.href = URL.createObjectURL(this.getExamplesBlob());
	a.target = "_self";
	a.download = "examples.json";
	a.click();
}

function loadExamples(component, data) {
	for (var i = 0; i < data.length; i++) {
		data[i]["idx"] = i + 1;
	}
	Object.assign(component.examples, [], data);
	component.$parent.loadExamples(data);
}

function receive(data) {
	if (data.status == 404) {
		throw "Server API not found (HTTP 404) on " + data.url;
	} else if (data.status != 200) {
		throw "HTTP " + data.status + ": " + data.statusText + " (" + data.url + ")";
	}
	return data.json();
}
function loadRules(component, data) {
	for (var i = 0; i < data.length; i++) {
		data[i].id = i + 1;
	}
	component.rules = data;
	var d = new Date(), time = [d.getHours(), d.getMinutes(), d.getSeconds()].map(v => (v < 10) ? '0'+v : v).join(':');
	component.loadMsg = "Current file: " + (tmp_filename == undefined ? 'Demo' : tmp_filename) + "        " +  time;
	loadCharacteristics(component);
	component.$parent.load( component.attributes, component.rules, component.characteristics );
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

function submit(data) {
	var files = data.attributes != undefined ? data : {
		attributes: document.getElementById("attributes").files[0],
		rules: document.getElementById("rules").files[0],
		examples: document.getElementById("examples").files[0]
	};
	var component = this;

	if (files.attributes == undefined || files.rules == undefined) {
		this.loadMsg = "Load attributes and rules before submit.";
		return;
	} 
	var reader = new FileReader();
	reader.onload = function() {
		loadAttributes(component, JSON.parse(reader.result));
		var reader2 = new FileReader();
		reader2.onload = function() {
			loadExamples(component, JSON.parse(reader2.result));

			var formData = new FormData();
			formData.append("attributes", files.attributes);
			formData.append("rules", files.rules);
			formData.append("examples", files.examples);

			fetch(getAPI(), {
				method: "POST",
				body: formData
			})
				.then(response => receive(response))
				.then(function(data) {
					loadRules(component, data.rules);
					loadMatching(component.examples, data.examples);
					component.files = files;
				})
				.catch(function(msg) {
					component.loadMsg = msg;
				});
		};
		reader2.readAsText(files.examples);
	};
	reader.readAsText(files.attributes);
	
}

function loadMatching(examples, pairs) {
	for (var i = 0; i < examples.length; i++) {
		examples[i].rules = pairs[i].rules;
	}
}

function loadDemo() {
	var submit = this.submit;
	tmp_filename = undefined;
	var getFile = function(url) {
		return fetch(url, { method: "GET" })
		.then(response => response.blob()) 
	}
	var getFiles = function() { return Promise.all([ // waits for all fetches from server
		getFile("/data/attributes.json"), 
		getFile("/data/rules.xml"), 
		getFile("/data/examples.json")
	]); };
	getFiles().then( ([a, r, e]) => {
		submit({attributes: a, rules: r, examples: e});
	});
}

function loadCharacteristics(component) {
	var unknown = "undefined"; // must be the same identifier as in the rules.json file returned from server
	for (var rule of component.rules) {
		for (var name in rule.characteristics) {
			var value = rule.characteristics[name];
			if (value == unknown) continue;
			else if (component.characteristics[name] == undefined) {
				component.characteristics[name] = { range: [value, value] };
			} else {
				var range = component.characteristics[name].range;
				range[0] = Math.min(range[0], value);
				range[1] = Math.max(range[1], value);
			}
		}
	}
	var i = 1;
	for (name in component.characteristics) {
		var c = component.characteristics[name];
		c.name = name;
		c.active = c.range[0] != c.range[1];
		c.id = i;
		i += 1;
		c.filter = c.active;
		c.display = c.active;
		c.range[0] = Math.floor(c.range[0] * 1000) / 1000;
		c.range[1] = Math.ceil(c.range[1] * 1000) / 1000;
		c.min = c.range[0];
		c.max = c.range[1];
		c.step = c.max > 1 ? 1 : 0.01;
	}
	component.characteristics = Object.assign( {}, component.characteristics, {} );
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.form-group { margin-bottom: 5px; width: 400px; }
.tabs { margin-top: 10px; }
.btn { margin-right: 10px; }
.form-control-sm { width: 330px; }
</style>
