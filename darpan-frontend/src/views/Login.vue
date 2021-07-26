<template>
  <v-layout justify-center>
    <v-card
      :width="isMobile ? '100%' : '50%'"
      :height="isMobile ? '100%' : 'auto'"
    >
      <v-card-title>
        <h3>Login</h3>
      </v-card-title>
      <v-card-text>
        <v-form ref="form" @submit.prevent="onLogin">
          <v-text-field
            v-model="username"
            label="Username"
            prepend-icon="mdi-account-circle"
            :rules="[(v) => !!v || 'Username is required']"
          />
          <v-text-field
            v-model="password"
            label="Password"
            type="password"
            prepend-icon="mdi-lock"
            :rules="[(v) => !!v || 'Password is required']"
          />
          <v-row class="mt-2">
            <v-btn width="100%" color="indigo" type="submit">Login</v-btn>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </v-layout>
</template>

<script>
const axios = require("axios");
const mobile = require("is-mobile");

export default {
  name: "Login",
  data() {
    return {
      isMobile: mobile(),
      username: "",
      password: "",
    };
  },
  methods: {
    onLogin() {
      if (!this.$refs.form.validate()) return;
      axios
        .get(`/login`, {
          auth: {
            username: this.username,
            password: this.password,
          },
        })
        .then((res) => {
          this.$router.push(`/Photos`);
        })
        .catch((err) => {
          this.$toasted.error(err.response.data);
        });
    },
  },
};
</script>