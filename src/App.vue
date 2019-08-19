<template>
  <div id="app" class="container">
    <!-- <img alt="Vue logo" src="./assets/logo.png" /> -->
    <div class="tabs">
        <a @click="activetab=1" :class="[ activetab === 1 ? 'active' : '' ]">Setup</a>
        <a @click="activetab=2" :class="[ activetab === 2 ? 'active' : '' ]">Data</a>
        <a @click="activetab=3" :class="[ activetab === 3 ? 'active' : '' ]">Visualization</a>
    </div>
    <div class="content">
        <FormLoader :class="['tab-content', activetab != 1 ? 'hidden' : '']"></FormLoader>
        <FilterTab  :class="['tab-content', activetab != 2 ? 'hidden' : '']" :characteristics="characteristics" :attributes="attributes"></FilterTab>
        <TableTab  :class="['tab-content', activetab != 2 ? 'hidden' : '']" :rules="rules" :characteristics="characteristics"></TableTab>
        <div style="clear:both;"></div>
    </div>
  </div>
</template>

<script>
import FormLoader from "./components/FormLoader.vue";
import FilterTab from "./components/FilterTab.vue";
import TableTab from  "./components/TableTab.vue";

export default {
  name: "app",
  data() { return {
      activetab: 1,
      rules: [],
      attributes: [],
      characteristics: { }
  }},
  methods: {
    load(a, r, c) {
        window.app = this;
        this.attributes = a;
        this.rules = r;
        this.characteristics = c;
    }
  },
  components: {
    FormLoader, FilterTab, TableTab
  }
};


</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    text-align: left;
  }
  
  .container {  
      min-width: 420px;
      max-width: 100% !important;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 0.9em;
      color: #888;
  }

  .content {
      margin: 0px 0px;
  }

  .tab-content {
      margin: 10px;
  }
  
  .rule-value {
      font-weight: bold;
      color: #000077;
  }

  .range {
      max-width: 100px;
  }
  .hidden {
      display: none;
  }
  .tabs {
      overflow: hidden;
      margin-bottom: -2px; 
      width: 100%;
  }

  .tabs ul {
      list-style-type: none;
      margin-left: 20px;
  }

  .tabs a{
      float: left;
      cursor: pointer;
      padding: 6px 24px;
      transition: background-color 0.2s;
      border: 1px solid #ccc;
      border-right: none;
      background-color: #f1f1f1;
      font-weight: bold;
  }
  .tabs a:last-child { 
      border-right: 1px solid #ccc;
  }

  /* Change background color of tabs on hover */
  .tabs a:hover {
      background-color: #aaa;
      color: #fff;
  }

  /* Styling for active tab */
  .tabs a.active {
      background-color: #fff;
      color: #484848;
      border-bottom: 2px solid #fff;
      cursor: default;
  }

  .scrollbar::-webkit-scrollbar-track
  {
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
    background-color: #F5F5F5;
    margin-top: 31px;
  }
  .scrollbar::-webkit-scrollbar
  {
    width: 10px;
    height: 10px;
  }
  .scrollbar::-webkit-scrollbar-thumb
  {
    background-color: #000000;
    border: 2px solid #555555;
  }

</style>
