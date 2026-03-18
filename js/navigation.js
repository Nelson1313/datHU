const viewOrder = ["calculator", "registration", "other", "market"];
let currentIndex = 0;

function showViewByIndex(index) {

    currentIndex = index;

    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.getElementById("view-" + viewOrder[index]).classList.add("active");

    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));

    const navMap = {
        calculator: 0,
        registration: 1,
        other: 2,
        market: 3
    };

    const navItems = document.querySelectorAll(".nav-item");

    if (navMap[viewOrder[index]] !== undefined) {
        navItems[navMap[viewOrder[index]]].classList.add("active");
    }

    updateArrows();

}

function nextView() {
    if (currentIndex < viewOrder.length - 1) {
        showViewByIndex(currentIndex + 1);
    }
}

function prevView() {
    if (currentIndex > 0) {
        showViewByIndex(currentIndex - 1);
    }
}

function switchView(e, view) {

    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    e.target.classList.add("active");

    document.querySelectorAll(".view").forEach(el => el.classList.remove("active"));
    document.getElementById("view-" + view).classList.add("active");

    viewOrder.forEach((v, i) => {
        if (v === view) currentIndex = i;
    });

    updateArrows();

}

function switchViewLogo(view) {

    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));

    document.querySelectorAll(".view").forEach(el => el.classList.remove("active"));
    document.getElementById("view-" + view).classList.add("active");

    currentIndex = -1;

    updateArrows();

}

function updateArrows() {

    const left = document.getElementById("arrow-left");
    const right = document.getElementById("arrow-right");

    const activeView = document.querySelector(".view.active").id;

    if (activeView === "view-welcome") {
        left.classList.add("hidden");
        right.classList.add("hidden");
        return;
    }

    if (activeView === "view-calculator") {
        left.classList.add("hidden");
        right.classList.remove("hidden");
    }

    if (activeView === "view-registration") {
        left.classList.remove("hidden");
        right.classList.remove("hidden");
    }

    if (activeView === "view-other") {
        left.classList.remove("hidden");
        right.classList.remove("hidden");
    }

    if (activeView === "view-market") {
        left.classList.remove("hidden");
        right.classList.add("hidden");
    }

}