<template>
    <div class="rule-table scrollbar">
        <table class="table table-sm">
            <thead>
                <tr>
                    <th @click="sort('id', $event.target, 'asc')">ID<span /></th>
                    <th @click="sort('conditions', $event.target, 'asc')">Conditions<span />
						<img @click="flipMultiLine" style="float: right;" height="20px" src="/img/multiline.png" alt="multiline icon">
					</th>
                    <th @click="sort('decision', $event.target, 'asc')">Decision<span /></th>
                    <th v-for="(value, name) in dispCharacteristics" :key="value.id" @click="sort(name, $event.target, 'desc')">{{ value.dispName }}<span /></th>
                </tr>
            </thead>
            <tbody>
                <!-- <RuleRow v-for="rule of rules" v-bind:rule="rule" v-bind:key="rule.id"></RuleRow> -->
                <tr v-for="rule of dispRules" :key="rule.id">
                    <td>{{ rule.id }}</td>
                    <td @click="setRule(rule.id)" class="condition" v-html="conditionsToString(rule.conditions)"></td>
                    <td v-html="decisionsToString(rule.decisions)"></td>
                    <td class="text-right" v-for="(value, name) in dispCharacteristics" :key="value.id">{{ round(rule.characteristics[name], 3) }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/antd.css';

export default {
  name: "TableTab",
  props: {
      rules: Array,
      characteristics: Object
  },
  data: function() { return {
	  multiLine: true,
      orderby: '',
      orderby_dir: 'asc'
  }},
  computed: {
        dispCharacteristics: function() {
            return Object.keys(this.characteristics).filter(key => this.characteristics[key].display)
                .reduce((obj, key) => {
                    obj[key] = this.characteristics[key];
                    return obj;
                }, {});
        },
        dispRules: function() {
            var c = this;
            if (this.orderby == '' || this.orderby == 'id')
                return _.orderBy(this.rules, function(e) { return e.id }, [c.orderby_dir]);
            else if (this.orderby == 'conditions')
                return _.orderBy(this.rules, function(e) { return e.conditions.length }, [c.orderby_dir]);
            else if (this.orderby == 'decision')
                return _.orderBy(this.rules, function(e) { return (e.decisions[0][0].operator == ">=" ? 1000000 : -1000000) + e.decisions[0][0].value }, [c.orderby_dir]);
            else
                return _.orderBy(this.rules, function(e) { return e.characteristics[c.orderby] }, [c.orderby_dir]);
        }
  },
  components: {
      VueSlider
  },
  methods: {
	  conditionsToString, decisionsToString, round, sort, setRule,
	  flipMultiLine(e) {
		  this.multiLine = !this.multiLine;
		  e.stopPropagation();
	  } 
  } 
};

function operator(op) {
	var f = {">=": "\u2265", "<=": "\u2264", "==": "="};
    return f[op] || op;
}

function conditionsToString(conditions) {
    var result = "", joinSign = (this.multiLine ? '\n' : ', ');
    for (var condition of conditions) {
        result += joinSign + condition.name + " " + operator(condition.operator) + " " 
                + "<span class=\"rule-value\">" + condition.description + "</span>";
    }
    return result.substr(1);
}

function decisionsToString(decisions) {
    var decision = decisions[0][0];
    return decision.name + " " + operator(decision.operator) + " " 
                + "<span class=\"rule-value\">" + decision.description + "</span>";
}

function round(num, precision) {
    var x = Math.pow(10, precision);
    return Math.round(num * x) / x;
}

function setRule(id) {
	this.$emit('setRule', this.$event, id);
}

function sort(name, elem, default_dir) {
    if (this.orderby == name)
        this.orderby_dir = this.orderby_dir == 'asc' ? 'desc' : 'asc';
    else
        this.orderby_dir = default_dir;
	this.orderby = name;
	
	var elems = document.querySelectorAll('.rule-table th');
	for (var e of elems) { e.classList.remove('asc', 'desc'); }
	if (name != 'id') elem.classList.add(this.orderby_dir);
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.rule-table {
	overflow: auto;
	white-space: pre;
	flex: -1;
	display: inline-block;
	margin-right: 10px;
}

table { margin: 0; display: inline-block; }
table thead th {
	/* Freeze */ position: sticky; top: 0; background-color: white; border: 0;
	/* Link style */ cursor: pointer; text-decoration: underline;
}

/* Sort CSS */ 
.asc span::before { content: '▲'; } .desc span::before { content: '▼'; }

/* Freeze 2 first columns of table */
.table-sm td:first-child { min-width: 35px; max-width: 35px; }
table tr td:first-child,th:first-child { position: sticky; left: 0; }
table tr th:nth-child(2),td:nth-child(2) { position: sticky; left: 35px; }
table tr th:first-child,th:nth-child(2) { z-index: 1; }

/* Styling table body */
table tr:nth-child(even) td { background-color: white; }
table tr:nth-child(odd) td { background-color: #f0f0f0; }
.table-sm td:first-child { text-align: center; padding: 0 !important; }
.table-sm td,th { padding: 5px 10px !important; }
/* .rule-value ----> Not working, but working when moved to App.vue, probably bug. */ 
.condition { cursor: pointer; }
    
</style>
