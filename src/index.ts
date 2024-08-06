import path from "path";
import { readFileSync } from "fs";
import { chromium, type Locator } from "playwright";

type Credentials = {
  username: string;
  password: string;
  subjects: string[];
};

// Initial configuration
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

const { username, password, subjects }: Credentials = JSON.parse(
  readFileSync(
    path.join(import.meta.dirname, "credentials.json"),
    "utf-8",
  ).toString(),
);

const URLS = {
  LOGIN: "https://academic.ui.ac.id/main/Authentication/Index",
  LOGOUT: "https://academic.ui.ac.id/main/Authentication/Logout",
  HOME: "https://academic.ui.ac.id/main/Welcome",
  EDIT: "https://academic.ui.ac.id/main/CoursePlan/CoursePlanEdit",
  SUMMARY: "https://academic.ui.ac.id/main/CoursePlan/CoursePlanViewSummary",
};

async function urlNavigation(
  url: string,
  elementWaitFor: Locator,
): Promise<void> {
  while (true) {
    await page.goto(url);
    if (await elementWaitFor.isVisible()) {
      break;
    }
  }
}

async function buttonNavigation(
  button: Locator,
  urlDest: string,
  elementWaitFor: Locator,
): Promise<void> {
  await button.click();
  // Remove annoying trailing slash
  await page.waitForURL((url) => url.toString().replace(/\/$/, "") === urlDest);
  while (true) {
    await page.goto(page.url());
    if (await elementWaitFor.isVisible()) {
      break;
    }
  }
}

main: while (true) {
  // Login Page
  await urlNavigation(
    URLS.LOGIN,
    page.getByRole("heading", { name: "Sistem Informasi Akademik" }),
  );

  // Login to with user credentials and wait for main page
  await page.locator("input[name=u]").fill(username);
  await page.locator("input[name=p]").fill(password);
  await buttonNavigation(
    page.getByRole("button", { name: "Login" }),
    URLS.HOME,
    page.getByRole("heading", { name: "Selamat Datang" }),
  );

  // const isMahasiswa = await page.getByText('guest').isHidden()
  // if (!isMahasiswa) {
  //   console.log("guest")
  //   await urlNavigation(
  //     URLS.LOGOUT,
  //     page.getByRole("heading", { name: "Sistem Informasi Akademik" })
  //   );
  //   continue;
  // }

  war: while (true) {
    // War Page
    await urlNavigation(
      URLS.EDIT,
      page.getByRole("heading", {
        name: /(Pengisian|Penambahan) IRS/i,
      }),
    );

    // Logout when IRS isn't ready to be filled
    const isIRSReady = await page
      .getByRole("heading", { name: "Anda tidak dapat mengisi IRS" })
      .isHidden();
    if (!isIRSReady) {
      console.log("Logging Out");
      await urlNavigation(
        URLS.LOGOUT,
        page.getByRole("heading", { name: "Sistem Informasi Akademik" }),
      );
      continue main;
    }

    // Check all user subject choices and wait for the result page
    for (const subject of subjects) {
      const checkbox = page.getByLabel(subject);
      if (await checkbox.isVisible()) {
        await checkbox.check();
        console.log(`"${subject}" selected`);
      }
    }
    await buttonNavigation(
      page.getByRole("button", { name: "Simpan IRS" }),
      URLS.SUMMARY,
      page.getByRole("heading", { name: "Ringkasan IRS" }),
    );

    // Check if all matkul successfully saved
    const isSavedSuccessfully = subjects.every(
      async (subject) => await page.getByText(subject).isVisible(),
    );
    if (isSavedSuccessfully) {
      break main;
    }
  }
}

// WAR Success
console.log("Success Bruh, Gacor");
browser.close();
