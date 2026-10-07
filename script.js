const navigationToggle = document.querySelector("#nav-toggle");

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    if (navigationToggle instanceof HTMLInputElement) {
      navigationToggle.checked = false;
    }
  });
});

const coffeeForm = document.querySelector("#coffee-form");

if (coffeeForm instanceof HTMLFormElement) {
  const coffeeEmail = document.querySelector("#coffee-email");
  const coffeeAmount = document.querySelector("#coffee-amount");
  const coffeeStatus = document.querySelector("#coffee-status");
  const payButton = document.querySelector("#payButton");

  if (
    coffeeEmail instanceof HTMLInputElement &&
    coffeeAmount instanceof HTMLInputElement &&
    coffeeStatus instanceof HTMLElement &&
    payButton instanceof HTMLButtonElement
  ) {
    coffeeForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!coffeeForm.reportValidity()) return;

      const amountInKes = Number(coffeeAmount.value);
      const amountInSubunits = Math.round(amountInKes * 100);

      if (!Number.isSafeInteger(amountInSubunits) || amountInSubunits < 100) {
        coffeeStatus.textContent = "Enter a valid contribution amount of at least KES 1.";
        return;
      }

      if (typeof PaystackPop === "undefined") {
        coffeeStatus.textContent = "Paystack checkout could not load. Please refresh and try again.";
        return;
      }

      payButton.disabled = true;
      coffeeStatus.textContent = "Opening Paystack checkout…";

      const handler = PaystackPop.setup({
        key: "pk_live_10a548b4501caa4b4971002a957f26bc43b11acb",
        email: coffeeEmail.value.trim(),
        amount: amountInSubunits,
        currency: "KES",
        ref: `COFFEE_${Date.now()}`,
        label: "Coffee support",
        channels: ["mobile_money"],
        callback: (response) => {
          coffeeStatus.textContent =
            `Checkout returned reference ${response.reference}. ` +
            "M-PESA confirmation may take a moment; check your Paystack dashboard to confirm the payment.";
          payButton.disabled = false;
        },
        onClose: () => {
          coffeeStatus.textContent =
            "Paystack checkout closed. If you approved an M-PESA prompt, check your Paystack dashboard before trying again.";
          payButton.disabled = false;
        },
      });

      handler.openIframe();
    });
  }
}

const contactForm = document.querySelector("#contact-form");

if (contactForm instanceof HTMLFormElement) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(contactForm);
    const name = String(formData.get("name"));
    const email = String(formData.get("email"));
    const subject = String(formData.get("subject"));
    const message = String(formData.get("message"));
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    const mailto = `mailto:owinocliff328@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
  });
}

const repoGrid = document.querySelector("#repo-grid");
const githubStatus = document.querySelector("#github-status");

function appendProfileLink(message) {
  if (!(githubStatus instanceof HTMLElement)) return;

  githubStatus.textContent = message + " ";
  const profileLink = document.createElement("a");
  profileLink.href = "https://github.com/jimmy4cb";
  profileLink.target = "_blank";
  profileLink.rel = "noopener noreferrer";
  profileLink.textContent = "Open my GitHub profile.";
  githubStatus.append(profileLink);
}

function createRepoCard(repository) {
  const card = document.createElement("article");
  card.className = "repo-card";

  const heading = document.createElement("h3");
  const link = document.createElement("a");
  link.href = repository.html_url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = repository.name;
  heading.append(link);

  const description = document.createElement("p");
  description.textContent = repository.description || "No description provided.";

  const metadata = document.createElement("div");
  metadata.className = "repo-meta";
  const language = document.createElement("span");
  language.textContent = repository.language || "Language not specified";
  const stars = document.createElement("span");
  stars.textContent = `${repository.stargazers_count} stars`;
  const updated = document.createElement("span");
  const updatedDate = new Date(repository.updated_at);
  updated.textContent = Number.isNaN(updatedDate.valueOf())
    ? "Update date unavailable"
    : `Updated ${new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(updatedDate)}`;

  metadata.append(language, stars, updated);
  card.append(heading, description, metadata);
  return card;
}

async function loadPublicRepositories() {
  if (!(repoGrid instanceof HTMLElement) || !(githubStatus instanceof HTMLElement)) return;

  try {
    const response = await fetch(
      "https://api.github.com/users/jimmy4cb/repos?per_page=100&sort=updated",
      { headers: { Accept: "application/vnd.github+json" } }
    );

    if (!response.ok) {
      throw new Error(`GitHub returned HTTP ${response.status}`);
    }

    const repositories = await response.json();
    if (!Array.isArray(repositories)) {
      throw new Error("GitHub returned an unexpected repository list.");
    }

    const recentRepositories = repositories
      .filter((repository) => {
        if (
          !repository ||
          repository.fork ||
          repository.size === 0 ||
          repository.owner?.login !== "jimmy4cb" ||
          typeof repository.name !== "string" ||
          typeof repository.html_url !== "string"
        ) {
          return false;
        }

        return repository.html_url.startsWith("https://github.com/");
      })
      .slice(0, 6);

    if (recentRepositories.length === 0) {
      appendProfileLink("No public repositories are available to display.");
      return;
    }

    repoGrid.replaceChildren(...recentRepositories.map(createRepoCard));
    githubStatus.textContent = `Showing ${recentRepositories.length} recently updated public repositories.`;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unexpected error";
    appendProfileLink(`Repositories could not be loaded: ${detail}.`);
  }
}

loadPublicRepositories();
