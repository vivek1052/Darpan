<template>
  <v-card>
    <v-toolbar dense>
      <v-spacer></v-spacer>
      <v-toolbar-title>Create New Album</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="$emit('close')" color="primary">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
    <v-card-title>{{ albumName }}</v-card-title>
    <v-container>
      <v-form ref="form" @submit.prevent="onCreate">
        <v-col>
          <v-text-field
            v-model="albumName"
            label="Album Name"
            :rules="[(v) => !!v || 'Album name is required']"
          ></v-text-field>
          <v-text-field v-model="albumLocation" label="Location"></v-text-field>
          <v-text-field
            v-model="albumDescrip"
            label="Album Description"
          ></v-text-field>
          <v-btn width="100%" color="primary" type="submit"> Create </v-btn>
        </v-col>
      </v-form>
    </v-container>
  </v-card>
</template>

<script>
const axios = require("axios");

export default {
  name: "NewAlbum",
  data() {
    return {
      albumName: "New Album",
      albumLocation: "",
      albumDescrip: "",
    };
  },
  methods: {
    onCreate() {
      if (!this.$refs.form.validate()) return;

      axios
        .post(`/darpan/Albums`, {
          name: this.albumName,
          description: this.albumDescrip,
        })
        .then((res) => {
          if (res.status == 201) {
            this.$toasted.success("Album Created");
            this.$emit("created");
          }
        })
        .catch((err) => {
          console.log(err);
          this.$toasted.error("Error Occurred");
        });
    },
  },
};
</script>