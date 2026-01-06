const statusPill = document.querySelector(".pill");

if (statusPill && window.projectX?.version) {
  statusPill.textContent = `Installed · v${window.projectX.version}`;
}
