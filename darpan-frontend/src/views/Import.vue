<template>
  <v-container fluid>
    <v-col align="center">
      <v-select :items="items" v-model="selectedItem" @click="onInputClick" />
      <v-btn width="100%" color="primary" @click="onImportClick">Import</v-btn>
    </v-col>
  </v-container>
</template>
<script>
const axios = require("axios");
export default {
  name: "Import",
  data() {
    return {
      items: [],
      selectedItem: "",
    };
  },
  created() {
    axios.get(`/darpan/GetImportFolders()`).then((res) => {
      this.items = res.data.value;
    });
  },
  methods: {
    onImportClick: function () {
      axios
        .post(`/darpan/Import`, {
          folder: this.selectedItem,
        })
        .then((res) => console.log(res));
    },
    onInputClick() {
      axios.get(`/darpan/GetImportFolders()`).then((res) => {
        this.items = res.data.value;
      });
    },
  },
};
</script>
