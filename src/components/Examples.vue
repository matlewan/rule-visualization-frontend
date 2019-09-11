<template>
    <div v-show="attributes.length > 0" style="float: left;">
    <h5>Examples</h5>
    <div class="examples scrollbar">
        <table class="table table-sm">
            <tbody>
                <tr v-for="e in examples" :key="e.idx">
                    <td @click="idx = e.idx">Example {{ getID(e.idx) }}</td>
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
	<h5 style="max-width: 350px;">Example {{ getID(idx) }}</h5>
    <div class="example scrollbar">
        <table class="table table-sm">
            <tbody>
                <tr v-for="(value, name) in example" :key="name" v-show="['idx', 'rules'].indexOf(name) < 0">
					<template v-if="attr(name).active">
					<td><label>{{ name }}</label></td>
                    <td>
                        <input type="text" name="ID" v-if="attr(name).valueType == undefined" v-model="example[name]" readonly>
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
    <button @click="reset" class="btn btn-primary">Reset</button>
    <button @click="match" class="btn btn-success">Match</button>
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
	  srcExamples: Array,
	  ruleId: Number
  },
  data() { return {
      conditionLike: '',
      all: false,
      aOperator: "OR",
      dOperator: "",
      activetab: 1,
	  idx: 1
  }},
  methods: {
      match, add, del, reset, attr, clearRuleId, edit, getID
  },
  computed: {
	  example: function() {
		  return this.srcExamples.find(e => e.idx == this.idx);
	  }
  }
};

function getID(idx) {
	var a = this.attributes.find(a => (a.active && a.valueType == undefined));
	var e = this.srcExamples.find(e => e.idx == idx);
	if (e == undefined) return undefined;
	return (a == undefined) ? e.idx : e[a.name];
}

function edit(idx) {
	Vue.set(this.srcExamples.find(e => e.idx == idx), 'rules', undefined);
}

function match() {
	if (this.examples.length == 0) return;
    var data = {
        example: this.examples.find(e => e.idx == this.idx)
	};
	if (data.example.rules == undefined) {
		alert('This example was added or changed.\nClick on Update button (Setup card) for refresh matching.' );
	}
	else this.$parent.$emit('match', this.$event, data);
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
	var example = {};
	var idx = this.srcExamples.length + 1
	example['ID'] = uuidv4();
	example.idx = idx;
	example.rules = undefined;
	for (var attribute of app.attributes.filter(a => a.example && a.name != 'ID')) {
		example[attribute.name] = 0;
	}
	this.srcExamples.push(example);
	this.idx = idx;
}

function del() {
	var e = this.srcExamples.find(e => e.idx == this.idx);
	var index = this.srcExamples.indexOf(e);
	this.$delete(this.srcExamples, index);
	index = Math.max(0, index-1);
	this.idx = this.srcExamples[index].idx;
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
        margin-top: 10px;
        cursor: pointer;
    }
    .example {
        max-height: 50vh;
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
