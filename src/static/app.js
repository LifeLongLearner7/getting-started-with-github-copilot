document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const activityTemplate = document.getElementById("activity-template");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message / existing cards
      activitiesList.innerHTML = "";

      // Reset select (keep first placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list using template
      Object.entries(activities).forEach(([name, details]) => {
        const clone = activityTemplate.content.cloneNode(true);

        const titleEl = clone.querySelector(".activity-title");
        const descEl = clone.querySelector(".activity-desc");
        const scheduleEl = clone.querySelector(".activity-schedule");
        const capacityUsedEl = clone.querySelector(".capacity-used");
        const capacityMaxEl = clone.querySelector(".capacity-max");
        const participantsListEl = clone.querySelector(".participants-list");
        const noParticipantsEl = clone.querySelector(".no-participants");
        const cardEl = clone.querySelector(".activity-card");

        titleEl.textContent = name;
        descEl.textContent = details.description;
        scheduleEl.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;
        capacityUsedEl.textContent = details.participants.length;
        capacityMaxEl.textContent = details.max_participants;

        // Availability (spots left)
        const spotsLeft = details.max_participants - details.participants.length;
        const availabilityEl = document.createElement("p");
        availabilityEl.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
        // Insert availability after schedule/capacity
        const capacityNode = clone.querySelector(".activity-capacity");
        capacityNode.after(availabilityEl);

        // Populate participants list or show empty state
        participantsListEl.innerHTML = "";
        if (details.participants && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.textContent = p;
            participantsListEl.appendChild(li);
          });
          noParticipantsEl.classList.add("hidden");
          participantsListEl.classList.remove("hidden");
        } else {
          noParticipantsEl.classList.remove("hidden");
          participantsListEl.classList.add("hidden");
        }

        activitiesList.appendChild(clone);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh activities to show updated participants and availability
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
