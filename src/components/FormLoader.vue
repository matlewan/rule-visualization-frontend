<template>
  <div>
      <form style="max-width: 500px;">
          <div class="form-group">
              <input type="file" class="file" id="attributes" style="display: none;" @change="setAttributes">
              <div class="input-group col-xs-12">
                  <button class="browse btn-sm btn-secondary input" type="button" @click="browseAttributes">Browse</button>
                  <input id="attributesText" type="text" class="form-control input" disabled placeholder="Upload attributes file in JSON format">
              </div>
          </div>
          <div class="form-group">
              <input type="file" class="file" id="rules" style="display: none;" @change="setRules">
              <div class="input-group col-xs-12">
                  <button class="browse btn-sm btn-secondary input" type="button" @click="browseRules">Browse</button>
                  <input id="rulesText" type="text" class="form-control input" disabled placeholder="Upload rules file in XML format">
              </div>
          </div>
          <div class="form-group">
              <input type="file" class="file" id="examples" style="display: none;" @change="setExamples">
              <div class="input-group col-xs-12">
                  <button class="browse btn-sm btn-secondary input" type="button" @click="browseExamples">Browse</button>
                  <input id="examplesText" type="text" class="form-control input" disabled placeholder="Upload examples file in JSON format">
              </div>
          </div>
      </form>
      <span>{{ loadMsg }}</span><br>
      <button class="btn btn-primary" @click="submit">Submit</button>
      <button class="btn btn-info" @click="loadDemo">Load demo</button>
      <div class="tabs" v-if="attributes.length > 0">
        <a @click="activetab=1" :class="[ activetab === 1 ? 'active' : '' ]">Attributes</a>
        <a @click="activetab=2" :class="[ activetab === 2 ? 'active' : '' ]">Characteristics</a>
      </div>
      <div class="content" v-if="attributes.length > 0">
        <Attributes class='tab-content' v-show="activetab==1" :attributes="attributes"></Attributes>
        <Characteristics  class='tab-content' v-show="activetab==2" :characteristics="characteristics"></Characteristics>
      </div>
  </div>
</template>

<script>

import Attributes from "./Attributes.vue";
import Characteristics from "./Characteristics.vue";

export default {
  name: "FormLoader",
  data() { return {
      loadMsg: "",
      rules: [],
      attributes: [],
      characteristics: {},
      examples: [],
      activetab: 1
  }},
  methods: {
    setAttributes, setRules, setExamples, browseAttributes, browseRules, browseExamples, submit, loadDemo
  },
  components: {
    Attributes, Characteristics
  }
};
var tmp_filename;

function loadAttributes(component, data) {
    for ( var [i, attr] of data.entries()) {
      attr.id = i+1;
      attr.srcName = attr.name;
	  attr.example = attr.active;
	  attr.active = attr.name == "ID" ? false : attr.active;
	  attr.dispFilter = attr.active;
	  attr.min = 0;
	  attr.max = (attr.domain == undefined) ? 100 : attr.domain.length-1;
	  Vue.set(attr, 'filter', {
		  include: undefined,
		  op: '',
		  range: attr.preferenceType != 'none' ? [attr.min, attr.max] : []
	  });
    }
    component.attributes = data;
    component.attributes.sort((a, b) => a.active > b.active || a.active == b.active && a.name < b.name ? -1 : 1);
}

function loadExamples(component, data) {
	for (var i = 0; i < data.length; i++) {
		data[i]['idx'] = i+1;
	}
    for (var attribute of component.attributes) {
		var f = undefined;
        if (attribute.valueType == 'enumeration')
            f = function(x) { return attribute.domain.indexOf(x.toString()); };
		else if (attribute.valueType == 'real')
			f = function(x) { return parseFloat(x); };
		else if (attribute.valueType == 'integer')
			f = function(x) { return parseInt(x); };
		else
			f = function(x) { return x; };
		
        for (var i = 0; i < data.length; i++) {
            var value = data[i][attribute.srcName];
            if (value == undefined) continue;
            data[i][attribute.srcName] = f(value);
		}
	}
    Object.assign(component.examples, [], data);
    component.$parent.loadExamples(data);
}

function receive(data) {
  if (data.status == 404) {
      throw "Server API not found (HTTP 404) on " + data.url;
  }
  else if (data.status != 200) {
      throw "HTTP " + data.status + ": " + data.statusText + " (" + data.url + ")";
  }
  return data.json();
}
function loadRules(component, data) {
  for (var i = 0; i < data.length; i++) {
    data[i].id = i+1;
  }
  component.rules = data;
  component.loadMsg = 'Current file: ' + tmp_filename;
  loadCharacteristics(component);
  component.$parent.load(component.attributes, component.rules, component.characteristics);
}

function browseAttributes() { document.getElementById('attributes').click(); }
function browseRules() { document.getElementById('rules').click(); }
function browseExamples() { document.getElementById('examples').click(); }
function setAttributes() {
  var file = document.getElementById('attributes').files[0];
  document.getElementById('attributesText').value = file.name;
}
function setRules() {
  var file = document.getElementById('rules').files[0];
  document.getElementById('rulesText').value = file.name;
  tmp_filename = file.name;
}
function setExamples() {
  var file = document.getElementById('examples').files[0];
  document.getElementById('examplesText').value = file.name;
  tmp_filename = file.name;
}
function submit() {
  var attributes = document.getElementById('attributes').files[0];
  var rules = document.getElementById('rules').files[0];
  var examples = document.getElementById('examples').files[0];
  var component = this;

  if (attributes == undefined) {
      this.loadMsg = 'Load json file with attributes before submit.';
  } 
  else if (rules == undefined) {
      this.loadMsg = 'Load xml file with rules before submit.';
  }
  else {
      var reader = new FileReader();
      reader.onload = function() { 
          loadAttributes(component, JSON.parse(reader.result)); 
          var reader2 = new FileReader();
          reader2.onload = function() { loadExamples(component, JSON.parse(reader.result));  }
          reader2.readAsText(document.getElementById('examples').files[0]); 
      }
      reader.readAsText(document.getElementById('attributes').files[0]);

      var formData  = new FormData();
      formData.append('attributes', attributes);
      formData.append('rules', rules);

      fetch('http://127.0.0.1:8080/upload', {
        method: 'POST',
        body: formData
      })
      .then(response => receive(response))
      .then(data => loadRules(component, data))
      .catch(function(msg) {
        component.loadMsg = msg;
      });
  }
}

function loadDemo() {
  var component = this;
  tmp_filename = 'Demo file';
  fetch('/data/attributes.json', {
    method: 'GET'
  }).then(response => response.json())
  .then(function(data) {
    loadAttributes(component, data);

    fetch('/data/examples.json', {
      method: 'GET'
    }).then(response => response.json())
    .then(data => loadExamples(component, data));

    fetch('/data/rules.json', {
      method: 'GET'
    }).then(response => response.json())
    .then(data => loadRules(component, data));
    });
}

function loadCharacteristics(component) {
  var unknown = 'undefined'; // must be the same identifier as in the rules.json file returned from server
  for (var rule of component.rules) {
      for ( var name in rule.characteristics) {
          var value = rule.characteristics[name];
          if (value == unknown)
              continue;
          else if (component.characteristics[name] == undefined) {
              component.characteristics[name] = {range: [value, value]};
          }
          else {
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
      c.active = (c.range[0] != c.range[1]);
      c.id = i; i += 1;
      c.filter = c.active;
      c.display = c.active;
      c.range[0] = Math.floor(c.range[0] * 1000) / 1000;
      c.range[1] = Math.ceil(c.range[1] * 1000) / 1000;
      c.min = c.range[0]; 
      c.max = c.range[1];
      c.step = c.max > 1 ? 1 : 0.01;
  }
  component.characteristics = Object.assign({}, component.characteristics, {});
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    .form-group {
        margin-bottom: 5px;
        width: 400px;
    }

    .tabs {
        margin-top: 10px;
    }

    .btn {
        margin-right: 10px;
    }
</style>
