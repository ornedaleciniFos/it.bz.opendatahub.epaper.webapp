// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Vue from "vue";
import Router from "vue-router";
import Displays from "@/components/displays/Displays.vue";
import DisplayForm from "@/components/displays/DisplayForm.vue";
import Login from "@/components/Login.vue";
import Templates from "@/components/templates/Templates.vue";
import TemplateForm from "@/components/templates/TemplateForm.vue";
import Unauthorized from "@/components/Unauthorized.vue";
import DisplayScheduleForm from "@/components/displays/DisplayScheduleForm.vue";

Vue.use(Router);

const router = new Router({
  mode: 'history',
  routes: [
    {
      path: "/",
      redirect: {
        name: "Displays"
      }
    },
    {
      path: "/login",
      component: Login,
      name: 'Login',
      props: route => ({
        redirectPath: route.query.redirectPath,
      })
    },
    {
      path: "/unauthorized",
      component: Unauthorized,
      name: 'Unauthorized'
    },
    {
      path: "/displays",
      name: "Displays",
      component: Displays,
      meta: {
        isAuthenticated: true
      },
      props: route => ({
        displayId: route.query.displayId,
        screenWidth: parseInt(route.query.screenWidth),
        screenHeight: parseInt(route.query.screenHeight),
        screenBitDepth: parseInt(route.query.screenBitDepth),
      })
    },
    {
      path: "/display-form",
      name: "Display Form",
      component: DisplayForm,
      props: true,
      meta: {
        isAuthenticated: true
      }
    },
    {
      path: "/templates",
      name: "Templates",
      component: Templates,
      meta: {
        isAuthenticated: true
      }
    },
    {
      path: "/template-form",
      name: "Template Form",
      component: TemplateForm,
      props: true,
      meta: {
        isAuthenticated: true
      }
    },
     {
      path: "/schedule-form/", //:displayUuid",
      name: "Display Schedule Form",
      component: DisplayScheduleForm,
      props: true,
      meta: {
        isAuthenticated: true
     },
    },
  ],
});

router.beforeEach((to, from, next) => {
  if (to.meta.isAuthenticated) {
    if (!Vue.$keycloak.authenticated) {
      // The page is protected and the user is not authenticated. Redirect to login.
      next(`/login${window.location.pathname !== '/' ? `?redirectPath=${encodeURIComponent(window.location.pathname + window.location.search)}` : ''}`);
    } else if (Vue.$keycloak.hasResourceRole('admin', process.env.VUE_APP_KEYCLOAK_RESOURCE_CLIENT_ID)) {
      // The user was authenticated, and has the app role
      next()
    } else {
      // The user was authenticated, but did not have the correct role
      // Redirect to an error page
      next({ name: 'Unauthorized' })
    }
  } else if (Vue.$keycloak.authenticated && to.name === "Login") {
    // This page is Login and user is already authenticated
    // Redirect to home
    next("/")
  } else {
    // This page did not require authentication
    next()
  }
})

export default router;