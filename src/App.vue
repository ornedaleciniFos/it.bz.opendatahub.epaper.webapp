<!--
SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>

SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
  <div id="app">
    <div v-if="authenticated" class="topbar">
      <img class="logo" alt="Vue logo" src="./assets/logo_bn.svg" />
      <div class="routerHeader">
        <div class="site-name-container">
          <h3>{{ siteName }}</h3>
          <h4 v-if="currentRouteName">{{ currentRouteName }}</h4>
        </div>
        
      <div v-for="(route, index) in routes" :key="index" class="route-name-container">
          <router-link :to="route.link"  :exact-active-class="'active-route'">
            <h2 class="route-name">{{ route.name }}</h2>
          </router-link>
        </div>
          <a href="https://opendatahub.com/contact/" class="route-name-container">
            <h3 class="route-name">About us</h3>
        </a>
        
      </div>
      
      
      <div class="navbar">
        <img class="logoright" alt="OpenDataHub logo" src="./assets/opendatahub.svg" />
        <div class="userBox">
          <div>
            <img class="userlogo" alt="user logo" src="./assets/user.png" />
            <span>{{ username }}</span>
          </div>
          <div>
            <button v-if="username" @click="logout()" class="nav-item">
          <img class="logout" alt="logout icon" src="./assets/logout.png" @click="logout" />
          Logout
        </button>
          </div>
        </div>
      </div>
   </div>
    
    <div v-else>
      <img class="bigLogo" alt="Vue logo" src="./assets/logo.png" />
      <h3>{{ siteName }}</h3>
    </div>

    <div class="content" v-if="dataLoaded || !authenticated">
      <b-card title="Card Title" no-body>
        <b-card-body class="text-center">
          <router-view />
        </b-card-body>
      </b-card>
    </div>
    <b-spinner v-else></b-spinner>
    
     <footer class="footer">
      <div class="container">
        <span class="text-muted footer-text">@Open Data Hub | </span>
         <a href="https://noi.bz.it/en/privacy">
        <span class="text-muted footer-text">Privacy |</span>
        </a>
         <a href="">
        <span class="text-muted footer-text"> Imprint</span>
        </a>
      </div>
    </footer>
    
  </div>
  
  
  
</template>




<script>
export default {
  name: "app",
  data() {
    return {
      username: null,
      routes: [
        { name: "Displays", link: "/displays" },
        { name: "Templates", link: "/templates" },
      ],
      siteName: "eInk Display management site",
    };
  },
  computed: {
    currentRouteName() {
      if (this.routes.some((e) => e.name === this.$route.name)) {
        return this.$route.name;
      }
      return "";
    },
    authenticated() {
      return this.$store.state.authenticated;
    },
    dataLoaded() {
      return this.$store.state.dataLoaded;
    },
  },
  mounted() {
    if (this.authenticated) {
      this.$keycloak.loadUserInfo().then((info) => {
        this.username = info.name;
      });
    }

    if (!localStorage.getItem("noPrivacyMessage")) {
      this.showPrivacyToast();
    }
  },
  methods: {
    logout() {
      const redirectPath = window.location.origin + "/";
      this.$keycloak.logout({ redirectUri: redirectPath });
    },
    showPrivacyToast() {
      const id = `privacy-toast`;
      const $okButton = this.$createElement(
        "b-button",
        {
          on: {
            click: () => {
              this.$bvToast.hide(id);
              localStorage.setItem("noPrivacyMessage", true);
            },
          },
          class: "toastCloseButton",
        },
        "OK, don't show again"
      );

      // Create the toast
      this.$bvToast.toast(
        [
          "This site stores information regarding user identification. This information is necessary for the site to function.",
          $okButton,
        ],
        {
          id: id,
          title: "",
          toastClass: "privacyToast",
          toaster: "b-toaster-bottom-center",
          variant: "info",
          noAutoHide: true,
          noCloseButton: true,
        }
      );
    },
  },
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 20px;
}

.content {
  margin-top: 20px;
}

.topbar {
  height: 75px;
}
.nav-item {
  float: left;
  margin-top:10px;
}
.navbar {
  float: right;
}
.footer {
  position: relative;
  margin-top: auto; /* Push footer to the bottom */
  width: 100%;
  height: 100px; /* Adjust this value according to your footer height */
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.site-name-container {
  border: 2px solid black;
  border-radius: 8px;
  padding: 5px;
  display: inline-block;
  margin-left: 10px;
}

.route-name-container {
  padding: 5px;
  display: inline-block;
  margin-left: 50px;
}
.active-route {
  background-color: #f0f0f0; /* Set your desired gray color */
}
.route-name {
  font-size: 35px; /* Set your desired font size */
  color: black; /* Set your desired text color */
}
.logo {
  margin-left: 20px;
  margin-top: 8px;
  float: left;
  
}
.logoright {
  margin-right: 20px;
  margin-top: 8px;
  float: right;
  width: 60px; /* Adjust width as needed */
  height: 60px;
  
}
.userlogo {
  margin-right: 10px;
  float: left;
  width: 20px; /* Adjust width as needed */
  height: 20px;
}

.logout {
  margin-right: 10px;
  float: left;
  width: 20px; /* Adjust width as needed */
  height: 20px;
}

.bigLogo {
  margin-bottom: 25px;
}

.footer-text {
  font-size: 23px; /* Adjust the font size as needed */
}
.routerHeader {
  float: left;
  text-align: left;
  margin-left: 30px;
  color: black; /* Set color to black */
  font-size: 24px; /* Set font size to 24px */
}

.userBox {
  border-radius: 8px;
  border: 2px solid #aaaaaa;
  align-items:center;
}

.privacyToast {
  padding-bottom: 35px;
}

.toastCloseButton {
  float: right;
  margin-top: 20px;
}
</style>
