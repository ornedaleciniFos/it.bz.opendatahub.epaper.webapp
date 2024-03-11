<!--
SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <div>
    <button @click="login" class="px-4 py-4">
      Log in with <strong>NOI Authentication</strong>
    </button>
  </div>
</template>

<script>
export default {
  name: "Login",
  props: {
    redirectPath: {
      type: String,
      default: "/",
    },
  },
  methods: {
       login() {
      const redirectUri = window.location.origin + this.redirectPath;
      this.$keycloak.login({ redirectUri });
      },
  },
};
</script>
