<template>
    <div v-show="attributes.length > 0" style="float: left;">
    <h5>Examples</h5>
    <div class="examples scrollbar">
        <table class="table table-sm">
            <tbody>
                <tr v-for="e in examples" :key="e['ID']">
                    <td @click="idx = e.idx ">Example {{ e.idx }}</td>
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
    <h5>Example {{ idx }}</h5>
    <div class="example scrollbar">
        <table class="table table-sm">
            <tbody>
                <tr v-for="(value, name) in srcExamples[idx-1]" :key="name" v-show="name!='idx'">
                    <td><label>{{ name }}</label></td>
                    <td>
                        <input type="text" name="ID" v-if="name == 'ID'" v-model="srcExamples[idx-1][name]">
                        <input type="number" v-else-if="attr(name).valueType != 'enumeration'" v-model="srcExamples[idx-1][name]">
                        <select v-else v-model="srcExamples[idx-1][name]" class="form-control-sm">
                            <option v-for="(elem, idx) in attr(name).domain" :value="idx" :key="idx">
                                {{ elem }}
                            </option>
                        </select>

                    </td>
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
      match, add, del, reset, attr, clearRuleId
  }
};

function match() {
	if (this.examples.length == 0) return;
    var data = {
        example: this.examples[this.idx-1]
    };
    this.$parent.$emit('match', this.$event, data);
}

function clearRuleId() {
	this.$parent.$emit('setRule', this.$event, undefined);
}

function add() {
	var example = {};
	var idx = this.srcExamples.length + 1
	example['ID'] = idx;
	example.idx = idx;
	for (var attribute of app.attributes.filter(a => a.example && a.name != 'ID')) {
		example[attribute.name] = 0;
	}
	this.srcExamples.push(example);
	this.idx = idx;
}

function del() {
	this.$delete(this.examples, this.idx-1);
	if (this.idx > this.examples.length)
		this.idx -= 1;
}

function reset() {
    var data = { example: {} };
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
