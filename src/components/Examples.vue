<template>
    <div v-show="attributes.length > 0" style="float: left;">
	<div class="d-flex flex-row">
		<h5>Examples</h5>
		<img width="25px" height="25px" src="/help.png" alt="help icon" data-toggle="tooltip" title="Click on rule to display only covered examples by this rule.">
    </div>
	<div class="examples scrollbar">
        <table class="table table-sm">
            <tbody>
                <tr v-for="e in filteredExamples" :key="e.__idx">
                    <td @click="idx = e.__idx">{{ getID(e) }}</td>
                </tr>
            </tbody>
        </table>
    </div>
	Rule ID: {{ruleId}}  
	<button class="btn btn-secondary sm-btn" v-if="ruleId != undefined" @click="clearRuleId">Clear</button>
    <div class="buttons-examples">
        <button @click="idx = Math.max(idx-1, 1)" class="btn btn-secondary">&lt;</button>
        <button @click="idx = Math.min(idx+1, examples.length)" class="btn btn-secondary">&gt;</button>
        <button @click="add" class="btn btn-success">Add</button>
        <button @click="del" class="btn btn-danger">Del</button>
    </div>
	<h5 style="max-width: 350px;">{{ getID(example) }}</h5>
    <div class="example scrollbar">
        <table class="table table-sm">
            <tbody>
                <tr v-for="(value, name) in example" :key="name">
					<template v-if="attr(name).active">
					<td><label>{{ attr(name).dispName }}</label></td>
                    <td>
                        <input type="text" name="ID" v-if="attr(name).identifierType != undefined" v-model="example[name]">
                        <input type="number" v-else-if="attr(name).valueType != 'enumeration'" v-model="example[name]" @change="edit(idx)">
                        <select v-else v-model="example[name]" class="form-control-sm" @change="edit(idx)">
                            <option v-for="elem in attr(name).domain" :value="elem" :key="elem">
                                {{ elem }}
                            </option>
                        </select>
                    </td>
					</template>
                </tr>
            </tbody>
        </table>
    </div>
    <button @click="reset" class="btn btn-sm btn-primary">Reset</button>
    <button @click="match" class="btn btn-sm btn-success">Match</button>
	<button class="btn btn-sm btn-secondary" @click="download">Download</button>
    </div>
</template>

<script>
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/antd.css'

export default {
  name: "Examples",
  props: {
      attributes: Array,
	  examples: Array,
	  filteredExamples: Array,
	  ruleId: Number
  },
  data() { return {
      conditionLike: '',
      all: false,
      aOperator: "OR",
      activetab: 1,
	  idx: 1
  }},
  methods: {
      match, add, del, reset, attr, clearRuleId, edit, getID, download
  },
  computed: {
	  example: function() {
		  return this.examples.find(e => e.__idx == this.idx);
	  }
  },
  mounted: function() {
		this.$root.$on('updateExamples-ok', () => { 
			this.$parent.$emit('match', this.$event, { example: this.example }); 
		}); 
  }
};

function download() { 
	this.$root.$emit('downloadExamples'); 
}

function getID(e) {
	var a = this.attributes.find(a => (a.active && a.valueType == undefined));
	if (e == undefined) return undefined;
	return (a == undefined) ? "Example " + e.__idx : e[a.name];
}

function edit(idx) {
	Vue.set(this.examples.find(e => e.__idx == idx), '__rules', undefined);
}

function match() {
	if (this.example == undefined) return;
	if (this.example.__rules == undefined) {
		this.$root.$emit('updateExamples');
	}
	else this.$parent.$emit('match', this.$event, { example: this.example });
}

function clearRuleId() {
	this.$parent.$emit('setRule', this.$event, undefined);
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function add() {
	var example = { __idx: 0 };
	var ids = this.attributes.filter(a => a.active && a.identifierType == 'uuid').map(a => a.name);
	for (name of ids)
		example[name] = uuidv4(); 
	var idxs = this.examples.map(e => e.__idx)
	example.__idx = idxs.length == 0 ? 1 : Math.max(...idxs) + 1;
	for (var attribute of this.attributes.filter(a => a.active && a.identifierType == undefined)) {
		example[attribute.name] = attribute.domain != undefined ? attribute.domain[0] : 0;
	}
	this.examples.push(example);
	this.idx = example.__idx;
}

function del() {
	var index = this.examples.indexOf(this.examples.find(e => e.__idx == this.example.__idx));
	this.$delete(this.examples, index);
	index = Math.max(0, index-1);
	var e = this.examples[index]
	this.idx = e == undefined ? 0 : e.__idx;
}

function reset() {
    var data = { example: undefined };
    this.$parent.$emit('match', this.$event, data);
}

function attr(name) {
    var a = this.attributes.filter(a => a.name == name)[0];
	return (a==undefined) ? {} : a;
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

    table thead th {
        border: 0;
    }
    .examples,.example {
        flex-grow: 0;
        margin-right: 10px;
        margin-bottom: 5px;
        overflow: auto;
        width: 350px;
    }
    .examples {
        max-height:15vh;
        cursor: pointer;
    }
    .example {
        max-height: 45vh;
    }
    .example input,select {
        width: 130px;
        padding-left: 5px;
    }
    .examples label {
        max-width: 150px;
    }
    .examples input,.vue-slider {
        position: relative;
        background-color: white;
    }
    .buttons-examples .btn {
        margin-top: 10px;
        margin-bottom: 10px;
        padding: 0 10px;
    }
	.sm-btn { margin: 0 0 0 30px; padding: 0 5px; }

    .btn {
        margin-right: 5px;
    }
    
    .table-sm td {
        padding: 0.1rem;
    }

    .table {
        margin-bottom: 0;
    }


    td label {
        margin-top: 0.2rem;
        margin-bottom: 0.2rem;
    }

    .form-control-sm {
        height: calc(1rem + 10px);
        padding: 0;
    }
	
	.ruleId {
		width: 100px;
		padding-left: 10px;
	}
  
</style>
