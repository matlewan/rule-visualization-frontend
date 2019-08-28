<template>
    <div class="rule-table scrollbar">
        <table class="table table-sm">
            <thead>
                <tr>
                    <th @click="sort('id')">ID</th>
                    <th @click="sort('conditions')">Conditions</th>
                    <th @click="sort('decision')">Decision</th>
                    <th v-for="(value, name) in dispCharacteristics" :key="value.id" @click="sort(name)">{{ value.name }} </th>
                </tr>
            </thead>
            <tbody>
                <!-- <RuleRow v-for="rule of rules" v-bind:rule="rule" v-bind:key="rule.id"></RuleRow> -->
                <tr v-for="rule of dispRules" :key="rule.id">
                    <td>{{ rule.id }}</td>
                    <td v-html="conditionsToString(rule.conditions)"></td>
                    <td v-html="decisionsToString(rule.decisions)"></td>
                    <td class="value" v-for="(value, name) in dispCharacteristics" :key="value.id">{{ round(rule.characteristics[name], 3) }}</td>
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
            if (this.orderby == '') 
                return this.rules;
            else if (this.orderby == 'id')
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
      conditionsToString, decisionsToString, round, sort
  } 
};

function operator(op) {
    if (op == ">=") return "\u2265";
    else if (op == "<=") return "\u2264";
    else return op;
}

function conditionsToString(conditions) {
    var result = "";
    for (var condition of conditions) {
        result += "\n" + condition.name + " " + operator(condition.operator) + " " 
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

function sort(name) {
    if (this.orderby == name)
        this.orderby_dir = this.orderby_dir == 'asc' ? 'desc' : 'asc';
    else
        this.orderby_dir = 'asc';
    this.orderby = name;
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    .rule-table {
        height: 90vh;
        max-width: calc(100vw - 480px);
        overflow: auto;
        white-space: pre;
        flex-grow: 1;
        float: left;
        /* margin-top: -30px; */
    }

    table {
        margin: 0;
    }

    table thead th {
        position: sticky;
        top: 0;
        background-color: white;
        border: 0;
        cursor: pointer;
        text-decoration: underline;
    }

    .table-sm td,th {
        padding: 5px 10px !important;
    }

    table tr:nth-child(even) td {
        background-color: white;
    }
    table tr:nth-child(odd) td {
        background-color: #f0f0f0;
    }

    table tr td:first-child,th:first-child {
        position: sticky;
        left: 0;
    }
    table tr th:first-child {
        z-index: 1;
    }

    .value {
        text-align: right;
    }
    
</style>
