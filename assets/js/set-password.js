(() => {
  const form = document.querySelector("#passwordForm");
  const message = document.querySelector("#passwordMessage");
  const submitButton = form.querySelector("button[type=submit]");
  let staffProfile;

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const password = document.querySelector("#newPassword").value;
    const confirmation = document.querySelector("#confirmPassword").value;
    message.classList.remove("success");
    message.textContent = "";
    if (password !== confirmation) {
      message.textContent = "Kata sandi baru dan konfirmasinya belum sama.";
      document.querySelector("#confirmPassword").focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Menyimpan...";
    try {
      await window.counselingBackend.completeStaffSetup(password);
      message.classList.add("success");
      message.textContent = "Kata sandi berhasil diperbarui. Membuka halaman akun...";
      window.setTimeout(() => window.location.replace(window.counselingBackend.rolePage(staffProfile.role)), 700);
    } catch (error) {
      message.textContent = error.message || "Kata sandi gagal diperbarui. Silakan coba kembali.";
      submitButton.disabled = false;
      submitButton.textContent = "Simpan kata sandi baru";
    }
  });

  document.querySelector("#logoutButton").addEventListener("click", async event => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await window.counselingBackend.signOut();
    } catch (error) {
      message.textContent = `Gagal keluar: ${error.message}`;
      button.disabled = false;
    }
  });

  window.counselingBackend.guardPasswordChangePage().then(context => {
    if (!context) return;
    staffProfile = context.profile;
    document.querySelector("#accountEmail").textContent = context.user.email || context.profile.full_name;
    document.querySelector("#newPassword").focus();
  });
})();
