import { chromium } from "playwright";

const { username, password, subjects } = {
  username: "wisnu.nugroho31",
  password: "3MacjER4D$u2Qm88aPi#",
  subjects: ["Aljabar Linear - B"],
};

const URLS = {
  LOGIN: "https://academic.ui.ac.id/main/Authentication/Index",
  LOGOUT: "https://academic.ui.ac.id/main/Authentication/Logout",
  HOME: "https://academic.ui.ac.id/main/Welcome",
  EDIT: "https://academic.ui.ac.id/main/CoursePlan/CoursePlanEdit",
  SUMMARY: "https://academic.ui.ac.id/main/CoursePlan/CoursePlanViewSummary",
};

// Initial configuration
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

page.setDefaultNavigationTimeout(300000); // maks 5 menit

function getCurrentURL() {
  return page.url().replace(/\/$/, "");
}

async function login() {
  await page.locator("input[name=u]").fill(username);
  await page.locator("input[name=p]").fill(password);
  await page.getByRole("button", { name: "Login" }).click();
}

async function logout() {
  await page.goto(URLS.LOGOUT);
}

async function war() {
  for (const subject of subjects) {
    const checkbox = page.getByLabel(subject);
    if (await checkbox.isVisible()) {
      await checkbox.check();
      console.log(`"${subject}" dipilih`);
    }
  }
  await page.getByRole("button", { name: "Simpan IRS" }).click();
}

await page.goto(URLS.LOGIN);
while (true) {
  while (
    (await page
      // .getByText('Magister Kriminologi')
      .getByRole("heading", { name: "Sistem Informasi Akademik" })
      .isHidden()) &&
    (await page
      // .getByText('Wisnu Nugroho')
      .getByRole("heading", { name: "SIAKNG" })
      .isHidden())
  ) {
    console.log("refresh page error");
    await page.reload();
  }
  if (
    await page
      .getByRole("heading", { name: "Sistem Informasi Akademik" })
      .isVisible()
  ) {
    console.log("saatnya login");
    await login();
    continue;
  }
  if (getCurrentURL() === URLS.HOME) {
    await page.goto(URLS.EDIT);
    continue;
  }
  if (getCurrentURL() === URLS.EDIT) {
    if (
      await page
        .getByRole("heading", { name: "Anda tidak dapat mengisi IRS" })
        .isVisible()
    ) {
      console.log("Belum bisa ngisi!!!, war belum mulai");
      await logout();
      continue;
    }
    console.log("Di war page");
    if (
      await page.getByRole("heading", { name: "Penambahan IRS" }).isHidden()
    ) {
      console.log("Belum bisa ngisi!!!");
      continue;
    }
    console.log("Saatnya warkan!!!");
    await war();
    if (
      subjects.every(
        async (subject) => await page.getByText(subject).isVisible(),
      )
    ) {
      console.log("ngulang ngisi cuy");
      await page.goto(URLS.EDIT);
      continue;
    }

    console.log("Sukses mantap!!");
    break;
  }
}

await page.close()
await browser.close()
