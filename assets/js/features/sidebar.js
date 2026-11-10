// Mobile sidebar drawer.
import { $ } from "../core/dom.js";

export function closeSidebar() {
  $("#sidebar").classList.remove("open");
  $("#sidebarBackdrop").classList.remove("show");
}

export function bindSidebar() {
  $("#mobileMenu").onclick = () => {
    $("#sidebar").classList.add("open");
    $("#sidebarBackdrop").classList.add("show");
  };
  $("#sidebarClose").onclick = closeSidebar;
  $("#sidebarBackdrop").onclick = closeSidebar;
}
