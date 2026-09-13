/**
 * Roamly Demo Payment Gateway & Booking Checkout Flow
 * Handles dynamic date & guest calculations, curated add-ons pricing,
 * payment tab switching, test card autofill, simulated gateway processing,
 * declination simulation, and booking persistence (API + LocalStorage).
 */

document.addEventListener("DOMContentLoaded", () => {
    const checkoutRoot = document.getElementById("checkoutRoot");
    if (!checkoutRoot) return;

    // Listing data from root attributes
    const listingId = checkoutRoot.dataset.listingId;
    const listingTitle = checkoutRoot.dataset.listingTitle;
    const listingLocation = checkoutRoot.dataset.listingLocation;
    const listingImage = checkoutRoot.dataset.listingImage;
    const nightlyRate = parseFloat(checkoutRoot.dataset.nightlyRate) || 0;

    // Stepper navigation elements
    const stepperStep1 = document.getElementById("stepperStep1");
    const stepperDiv1 = document.getElementById("stepperDiv1");
    const stepperStep2 = document.getElementById("stepperStep2");
    const stepperDiv2 = document.getElementById("stepperDiv2");
    const stepperStep3 = document.getElementById("stepperStep3");

    // Stage cards
    const stageDetails = document.getElementById("stageDetails");
    const stagePayment = document.getElementById("stagePayment");
    const stageConfirmation = document.getElementById("stageConfirmation");

    // Form inputs
    const checkInInput = document.getElementById("checkInInput");
    const checkOutInput = document.getElementById("checkOutInput");
    const adultsCountInput = document.getElementById("adultsCountInput");
    const childrenCountInput = document.getElementById("childrenCountInput");
    const infantsCountInput = document.getElementById("infantsCountInput");
    const guestFullName = document.getElementById("guestFullName");
    const guestEmail = document.getElementById("guestEmail");
    const guestPhone = document.getElementById("guestPhone");

    // Room allocation elements
    const summaryRoomsDisplay = document.getElementById("summaryRoomsDisplay");
    const allocatedRoomsCountText = document.getElementById("allocatedRoomsCountText");
    const allocatedRoomsBadge = document.getElementById("allocatedRoomsBadge");
    const roomAllocationReason = document.getElementById("roomAllocationReason");

    // Error messages
    const nameError = document.getElementById("nameError");
    const emailError = document.getElementById("emailError");
    const phoneError = document.getElementById("phoneError");

    // Addons
    const addonBreakfast = document.getElementById("addonBreakfast");
    const addonTransfer = document.getElementById("addonTransfer");
    const addonTour = document.getElementById("addonTour");
    const addonCardBreakfast = document.getElementById("addonCardBreakfast");
    const addonCardTransfer = document.getElementById("addonCardTransfer");
    const addonCardTour = document.getElementById("addonCardTour");

    // Price summary elements
    const summaryNightsDisplay = document.getElementById("summaryNightsDisplay");
    const summaryBasePrice = document.getElementById("summaryBasePrice");
    const summaryAddonsRow = document.getElementById("summaryAddonsRow");
    const summaryAddonsPrice = document.getElementById("summaryAddonsPrice");
    const summaryTaxesPrice = document.getElementById("summaryTaxesPrice");
    const summaryGrandTotal = document.getElementById("summaryGrandTotal");
    const btnPayAmount = document.getElementById("btnPayAmount");

    // Buttons
    const proceedToPaymentBtn = document.getElementById("proceedToPaymentBtn");
    const backToDetailsBtn = document.getElementById("backToDetailsBtn");
    const submitPaymentBtn = document.getElementById("submitPaymentBtn");
    const processingOverlay = document.getElementById("processingOverlay");
    const processingStatusText = document.getElementById("processingStatusText");

    // Payment method elements
    const paymentTabBtns = document.querySelectorAll(".payment-tab-btn");
    const paymentPanels = document.querySelectorAll(".payment-panel");
    const paymentFailureAlert = document.getElementById("paymentFailureAlert");
    const failureAlertMessage = document.getElementById("failureAlertMessage");
    const tryAgainWithValidCardBtn = document.getElementById("tryAgainWithValidCardBtn");
    const fillValidCardBtn = document.getElementById("fillValidCardBtn");
    const fillFailCardBtn = document.getElementById("fillFailCardBtn");
    const cardNumberInput = document.getElementById("cardNumberInput");
    const cardHolderInput = document.getElementById("cardHolderInput");
    const cardExpiryInput = document.getElementById("cardExpiryInput");
    const cardCvvInput = document.getElementById("cardCvvInput");
    const cardBrandLabel = document.getElementById("cardBrandLabel");
    const cardBrandIcon = document.getElementById("cardBrandIcon");
    const upiIdInput = document.getElementById("upiIdInput");
    const bankCards = document.querySelectorAll(".bank-choice-card");
    const allBanksSelect = document.getElementById("allBanksSelect");
    const walletItems = document.querySelectorAll(".wallet-choice-item");

    // Confirmation elements
    const confirmedBookingId = document.getElementById("confirmedBookingId");
    const copyBookingIdBtn = document.getElementById("copyBookingIdBtn");
    const confirmGuestName = document.getElementById("confirmGuestName");
    const confirmGuestEmail = document.getElementById("confirmGuestEmail");
    const confirmDates = document.getElementById("confirmDates");
    const confirmNights = document.getElementById("confirmNights");
    const confirmTotalPaid = document.getElementById("confirmTotalPaid");
    const confirmedVoucherLink = document.getElementById("confirmedVoucherLink");

    // Active state tracking
    let activePaymentTab = "upi";
    let selectedBankName = "HDFC Bank";
    let selectedWalletName = "Paytm Wallet";
    let currentPricing = {
        nights: 3,
        baseRate: nightlyRate,
        baseTotal: nightlyRate * 3,
        addOnsTotal: 0,
        serviceFee: 0,
        taxes: Math.round(nightlyRate * 3 * 0.18),
        totalAmount: nightlyRate * 3 + Math.round(nightlyRate * 3 * 0.18),
        selectedAddonsList: []
    };

    // Ensure initial check-in is not before today
    const todayStr = new Date().toISOString().split("T")[0];
    if (checkInInput && (!checkInInput.value || checkInInput.value < todayStr)) {
        checkInInput.min = todayStr;
        checkInInput.value = todayStr;
    }

    // -------------------------------------------------------------
    // 1. INTELLIGENT ROOM ALLOCATION & DYNAMIC PRICING
    // -------------------------------------------------------------
    function calculateAllocatedRooms(adults = 1, children = 0, infants = 0) {
        const a = Math.max(1, parseInt(adults, 10) || 1);
        const c = Math.max(0, parseInt(children, 10) || 0);
        const inf = Math.max(0, parseInt(infants, 10) || 0);
        const roomsByAdults = Math.ceil(a / 2);
        const roomsByInfants = Math.ceil(inf / 2);
        const roomsByTotal = Math.ceil((a + c) / 3);
        return Math.max(1, roomsByAdults, roomsByInfants, roomsByTotal);
    }

    function calculatePricing() {
        const checkInDate = new Date(checkInInput.value || todayStr);
        let checkOutDate = new Date(checkOutInput.value || checkInInput.value);

        if (checkOutDate <= checkInDate) {
            checkOutDate = new Date(checkInDate);
            checkOutDate.setDate(checkOutDate.getDate() + 1);
            checkOutInput.value = checkOutDate.toISOString().split("T")[0];
        }

        const diffTime = Math.abs(checkOutDate - checkInDate);
        const nights = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
        const adults = parseInt(adultsCountInput.value, 10) || 1;
        const children = parseInt(childrenCountInput.value, 10) || 0;
        const infants = infantsCountInput ? (parseInt(infantsCountInput.value, 10) || 0) : 0;
        const totalGuests = adults + children + infants;
        const allocatedRooms = calculateAllocatedRooms(adults, children, infants);

        // Base total taking allocated rooms into account (nightlyRate * nights * rooms)
        const baseTotal = nightlyRate * nights * allocatedRooms;

        // Update Room Allocation UI
        if (allocatedRoomsCountText) {
            allocatedRoomsCountText.textContent = `${allocatedRooms} Room${allocatedRooms > 1 ? 's' : ''}`;
        }
        if (allocatedRoomsBadge) {
            allocatedRoomsBadge.textContent = `${allocatedRooms} Room${allocatedRooms > 1 ? 's' : ''}`;
        }
        if (summaryRoomsDisplay) {
            summaryRoomsDisplay.textContent = allocatedRooms;
        }
        if (roomAllocationReason) {
            if (allocatedRooms === 1) {
                roomAllocationReason.textContent = "Max 2 adults per room • Standard accommodation allocated";
            } else if (adults > 2 && adults % 2 !== 0) {
                roomAllocationReason.textContent = `${allocatedRooms} rooms allocated for ${adults} adults (maximum 2 adults per room)`;
            } else if (adults >= 4) {
                roomAllocationReason.textContent = `${allocatedRooms} rooms allocated for ${adults} adults (2 adults per room)`;
            } else if (infants > 2) {
                roomAllocationReason.textContent = `${allocatedRooms} rooms allocated to comfortably host infants and family`;
            } else {
                roomAllocationReason.textContent = `${allocatedRooms} rooms allocated for optimal guest comfort`;
            }
        }

        // Add-ons total
        let addOnsTotal = 0;
        const selectedAddonsList = [];

        if (addonBreakfast && addonBreakfast.checked) {
            const cost = 650 * totalGuests * nights;
            addOnsTotal += cost;
            selectedAddonsList.push({
                name: "Farm-to-Table Organic Breakfast",
                price: cost,
                details: `₹650 × ${totalGuests} guests × ${nights} nights`
            });
            if (addonCardBreakfast) addonCardBreakfast.classList.add("selected");
        } else if (addonCardBreakfast) {
            addonCardBreakfast.classList.remove("selected");
        }

        if (addonTransfer && addonTransfer.checked) {
            const cost = 1500;
            addOnsTotal += cost;
            selectedAddonsList.push({
                name: "Chauffeur Airport / Rail Transfer",
                price: cost,
                details: "Flat one-way transfer"
            });
            if (addonCardTransfer) addonCardTransfer.classList.add("selected");
        } else if (addonCardTransfer) {
            addonCardTransfer.classList.remove("selected");
        }

        if (addonTour && addonTour.checked) {
            const cost = 850 * totalGuests;
            addOnsTotal += cost;
            selectedAddonsList.push({
                name: "Heritage Tour & Sunset Tea",
                price: cost,
                details: `₹850 × ${totalGuests} guests`
            });
            if (addonCardTour) addonCardTour.classList.add("selected");
        } else if (addonCardTour) {
            addonCardTour.classList.remove("selected");
        }

        // Taxes & Sanctuary preservation (18% GST)
        const taxableAmount = baseTotal + addOnsTotal;
        const taxes = Math.round(taxableAmount * 0.18);
        const totalAmount = taxableAmount + taxes;

        currentPricing = {
            nights,
            rooms: allocatedRooms,
            adults,
            children,
            infants,
            baseRate: nightlyRate,
            baseTotal,
            addOnsTotal,
            serviceFee: 0,
            taxes,
            totalAmount,
            selectedAddonsList
        };

        // Render to DOM
        if (summaryNightsDisplay) summaryNightsDisplay.textContent = nights;
        if (summaryBasePrice) summaryBasePrice.textContent = `₹ ${baseTotal.toLocaleString("en-IN")}`;
        
        if (summaryAddonsRow && summaryAddonsPrice) {
            if (addOnsTotal > 0) {
                summaryAddonsRow.style.display = "flex";
                summaryAddonsPrice.textContent = `₹ ${addOnsTotal.toLocaleString("en-IN")}`;
            } else {
                summaryAddonsRow.style.display = "none";
            }
        }

        if (summaryTaxesPrice) summaryTaxesPrice.textContent = `₹ ${taxes.toLocaleString("en-IN")}`;
        if (summaryGrandTotal) summaryGrandTotal.textContent = `₹ ${totalAmount.toLocaleString("en-IN")}`;
        if (btnPayAmount) btnPayAmount.textContent = totalAmount.toLocaleString("en-IN");
    }

    // Attach reactive price calculation listeners
    [checkInInput, checkOutInput, adultsCountInput, childrenCountInput, infantsCountInput].forEach(elem => {
        if (elem) elem.addEventListener("change", calculatePricing);
    });

    [addonBreakfast, addonTransfer, addonTour].forEach(elem => {
        if (elem) elem.addEventListener("change", calculatePricing);
    });

    // Initial pricing run
    calculatePricing();

    // -------------------------------------------------------------
    // 2. FORM VALIDATION & STEP TRANSITIONS
    // -------------------------------------------------------------
    function validateStep1() {
        let isValid = true;

        if (!guestFullName.value.trim()) {
            guestFullName.classList.add("is-invalid");
            if (nameError) nameError.style.display = "block";
            isValid = false;
        } else {
            guestFullName.classList.remove("is-invalid");
            if (nameError) nameError.style.display = "none";
        }

        const emailVal = guestEmail.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailVal || !emailRegex.test(emailVal)) {
            guestEmail.classList.add("is-invalid");
            if (emailError) emailError.style.display = "block";
            isValid = false;
        } else {
            guestEmail.classList.remove("is-invalid");
            if (emailError) emailError.style.display = "none";
        }

        const phoneVal = guestPhone.value.replace(/\D/g, "");
        if (phoneVal.length < 10) {
            guestPhone.classList.add("is-invalid");
            if (phoneError) phoneError.style.display = "block";
            isValid = false;
        } else {
            guestPhone.classList.remove("is-invalid");
            if (phoneError) phoneError.style.display = "none";
        }

        return isValid;
    }

    if (proceedToPaymentBtn) {
        proceedToPaymentBtn.addEventListener("click", () => {
            if (!validateStep1()) {
                guestFullName.scrollIntoView({ behavior: "smooth", block: "center" });
                return;
            }

            // Move to Step 2
            stepperStep1.classList.remove("active");
            stepperStep1.classList.add("completed");
            stepperDiv1.classList.add("active");
            stepperStep2.classList.add("active");

            stageDetails.style.display = "none";
            stagePayment.style.display = "block";
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    if (backToDetailsBtn) {
        backToDetailsBtn.addEventListener("click", () => {
            stepperStep2.classList.remove("active");
            stepperStep1.classList.remove("completed");
            stepperStep1.classList.add("active");
            stepperDiv1.classList.remove("active");

            stagePayment.style.display = "none";
            stageDetails.style.display = "block";
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // -------------------------------------------------------------
    // 3. PAYMENT METHOD TABS & INTERACTIONS
    // -------------------------------------------------------------
    paymentTabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetTab = btn.dataset.tab;
            activePaymentTab = targetTab;

            paymentTabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            paymentPanels.forEach(p => p.classList.remove("active"));
            const targetPanel = document.getElementById(`panel-${targetTab}`);
            if (targetPanel) targetPanel.classList.add("active");

            // Hide failure alert when switching tabs
            if (paymentFailureAlert) paymentFailureAlert.classList.remove("show");
        });
    });

    // Card formatting & brand detection
    if (cardNumberInput) {
        cardNumberInput.addEventListener("input", (e) => {
            let val = e.target.value.replace(/\D/g, "").substring(0, 16);
            let formatted = "";
            for (let i = 0; i < val.length; i++) {
                if (i > 0 && i % 4 === 0) formatted += " ";
                formatted += val[i];
            }
            e.target.value = formatted;

            // Brand detection
            if (val.startsWith("4")) {
                cardBrandLabel.innerHTML = '<i class="fa-brands fa-cc-visa me-1"></i> Visa Demo';
                cardBrandIcon.className = "fa-brands fa-cc-visa input-leading-icon text-primary";
            } else if (val.startsWith("5")) {
                cardBrandLabel.innerHTML = '<i class="fa-brands fa-cc-mastercard me-1"></i> Mastercard Demo';
                cardBrandIcon.className = "fa-brands fa-cc-mastercard input-leading-icon text-warning";
            } else if (val.startsWith("6")) {
                cardBrandLabel.innerHTML = '<i class="fa-solid fa-credit-card me-1"></i> RuPay Demo';
                cardBrandIcon.className = "fa-solid fa-credit-card input-leading-icon text-success";
            } else if (val.startsWith("3")) {
                cardBrandLabel.innerHTML = '<i class="fa-brands fa-cc-amex me-1"></i> Amex Demo';
                cardBrandIcon.className = "fa-brands fa-cc-amex input-leading-icon text-info";
            } else {
                cardBrandLabel.textContent = "Valid Demo Card";
                cardBrandIcon.className = "fa-solid fa-credit-card input-leading-icon";
            }
        });
    }

    if (cardExpiryInput) {
        cardExpiryInput.addEventListener("input", (e) => {
            let val = e.target.value.replace(/\D/g, "").substring(0, 4);
            if (val.length >= 2) {
                e.target.value = val.substring(0, 2) + "/" + val.substring(2);
            } else {
                e.target.value = val;
            }
        });
    }

    // Test card autofill buttons
    function autofillCard(number, holder, expiry, cvv, labelHtml) {
        if (cardNumberInput) cardNumberInput.value = number;
        if (cardHolderInput) cardHolderInput.value = holder;
        if (cardExpiryInput) cardExpiryInput.value = expiry;
        if (cardCvvInput) cardCvvInput.value = cvv;
        if (cardBrandLabel && labelHtml) cardBrandLabel.innerHTML = labelHtml;
        if (paymentFailureAlert) paymentFailureAlert.classList.remove("show");
    }

    if (fillValidCardBtn) {
        fillValidCardBtn.addEventListener("click", () => {
            autofillCard("4242 4242 4242 4242", "Roamly Demo User", "12/30", "123", '<i class="fa-brands fa-cc-visa me-1"></i> Visa Demo');
        });
    }

    if (fillFailCardBtn) {
        fillFailCardBtn.addEventListener("click", () => {
            autofillCard("4000 0000 0000 0002", "Declining Test User", "12/30", "123", '<i class="fa-solid fa-triangle-exclamation text-danger me-1"></i> Declining Test Card');
        });
    }

    if (tryAgainWithValidCardBtn) {
        tryAgainWithValidCardBtn.addEventListener("click", () => {
            autofillCard("4242 4242 4242 4242", "Roamly Demo User", "12/30", "123", '<i class="fa-brands fa-cc-visa me-1"></i> Visa Demo');
            cardNumberInput.focus();
        });
    }

    // Net banking selection
    bankCards.forEach(card => {
        card.addEventListener("click", () => {
            bankCards.forEach(c => c.classList.remove("selected"));
            card.classList.add("selected");
            selectedBankName = card.dataset.bank;
            if (allBanksSelect) allBanksSelect.value = "";
        });
    });

    if (allBanksSelect) {
        allBanksSelect.addEventListener("change", (e) => {
            if (e.target.value) {
                bankCards.forEach(c => c.classList.remove("selected"));
                selectedBankName = e.target.value;
            }
        });
    }

    // Wallet selection
    walletItems.forEach(item => {
        item.addEventListener("click", () => {
            walletItems.forEach(i => i.classList.remove("selected"));
            item.classList.add("selected");
            selectedWalletName = item.dataset.wallet;
        });
    });

    // -------------------------------------------------------------
    // 4. SUBMIT PAYMENT & PROCESSING SIMULATION
    // -------------------------------------------------------------
    if (submitPaymentBtn) {
        submitPaymentBtn.addEventListener("click", async () => {
            const rawCardNumber = cardNumberInput ? cardNumberInput.value.replace(/\s/g, "") : "";

            // Check for intentional failure test card
            const isFailureCard = (activePaymentTab === "cards" && rawCardNumber.endsWith("0002"));

            // Show simulated processing overlay
            if (processingOverlay) {
                processingOverlay.classList.add("show");
                processingOverlay.setAttribute("aria-hidden", "false");
            }
            if (processingStatusText) {
                processingStatusText.textContent = "Connecting to demo payment gateway...";
            }

            // Step 1 status transition
            setTimeout(() => {
                if (processingStatusText) {
                    processingStatusText.textContent = isFailureCard 
                        ? "Contacting issuing bank for demo authorization..." 
                        : "Authorizing 256-bit sandbox transaction...";
                }
            }, 600);

            // Complete simulation after 1.6s
            setTimeout(async () => {
                if (isFailureCard) {
                    // Handle failure simulation
                    if (processingOverlay) {
                        processingOverlay.classList.remove("show");
                        processingOverlay.setAttribute("aria-hidden", "true");
                    }
                    if (paymentFailureAlert) {
                        paymentFailureAlert.classList.add("show");
                        paymentFailureAlert.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                    return;
                }

                // SUCCESS FLOW
                if (processingStatusText) {
                    processingStatusText.textContent = "Reservation confirmed! Preparing voucher...";
                }

                // Determine method label
                let paymentMethodLabel = "Demo UPI";
                if (activePaymentTab === "cards") {
                    const last4 = rawCardNumber.slice(-4) || "4242";
                    paymentMethodLabel = `Demo Card (•••• ${last4})`;
                } else if (activePaymentTab === "upi") {
                    paymentMethodLabel = `Demo UPI (${upiIdInput ? upiIdInput.value.trim() : 'demo.traveler@upi'})`;
                } else if (activePaymentTab === "netbanking") {
                    paymentMethodLabel = `Demo Net Banking (${selectedBankName})`;
                } else if (activePaymentTab === "wallets") {
                    paymentMethodLabel = `Demo Wallet (${selectedWalletName})`;
                }

                // Client fallback booking ID
                const fallbackBookingId = `ROAM-${Math.floor(100000 + Math.random() * 900000)}`;

                const aVal = parseInt(adultsCountInput.value, 10) || 1;
                const cVal = parseInt(childrenCountInput.value, 10) || 0;
                const iVal = infantsCountInput ? (parseInt(infantsCountInput.value, 10) || 0) : 0;
                const roomsCount = currentPricing.rooms || calculateAllocatedRooms(aVal, cVal, iVal);

                const payload = {
                    listingId,
                    guestDetails: {
                        fullName: guestFullName.value.trim(),
                        email: guestEmail.value.trim(),
                        phone: guestPhone.value.trim()
                    },
                    checkIn: checkInInput.value,
                    checkOut: checkOutInput.value,
                    nights: currentPricing.nights,
                    rooms: roomsCount,
                    guests: {
                        adults: aVal,
                        children: cVal,
                        infants: iVal,
                        total: aVal + cVal + iVal
                    },
                    addOns: currentPricing.selectedAddonsList,
                    pricing: {
                        baseRate: currentPricing.baseRate,
                        rooms: roomsCount,
                        baseTotal: currentPricing.baseTotal,
                        addOnsTotal: currentPricing.addOnsTotal,
                        serviceFee: currentPricing.serviceFee,
                        taxes: currentPricing.taxes,
                        totalAmount: currentPricing.totalAmount
                    },
                    payment: {
                        method: paymentMethodLabel,
                        status: "PAID • DEMO",
                        transactionId: `TXN-DEMO-${Date.now()}`
                    },
                    status: "CONFIRMED"
                };

                let assignedBookingId = fallbackBookingId;
                let persistedBooking = null;

                // Attempt server persistence
                try {
                    const res = await fetch("/api/bookings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if (data.success && data.bookingId) {
                        assignedBookingId = data.bookingId;
                        persistedBooking = data.booking;
                    }
                } catch (apiErr) {
                    console.warn("Backend booking persistence notice (using client storage fallback):", apiErr);
                }

                // Clean up any legacy shared storage to prevent cross-account leakage
                try {
                    localStorage.removeItem("roamly_bookings");
                } catch (e) {}

                // Scope client booking cache strictly by user ID
                const currentUserId = checkoutRoot?.getAttribute("data-user-id") || "";
                if (currentUserId) {
                    try {
                        const userScopedKey = `roamly_bookings_${currentUserId}`;
                        const existingBookings = JSON.parse(localStorage.getItem(userScopedKey) || "[]");
                        const clientBookingRecord = {
                            bookingId: assignedBookingId,
                            travelerId: currentUserId,
                            user: currentUserId,
                            propertyId: listingId,
                            listing: {
                                _id: listingId,
                                title: listingTitle,
                                location: listingLocation,
                                image: listingImage,
                                price: nightlyRate
                            },
                            guestDetails: payload.guestDetails,
                            checkIn: payload.checkIn,
                            checkOut: payload.checkOut,
                            nights: payload.nights,
                            rooms: roomsCount,
                            guests: payload.guests,
                            addOns: payload.addOns,
                            pricing: payload.pricing,
                            payment: payload.payment,
                            status: "CONFIRMED",
                            bookingStatus: "confirmed",
                            createdAt: new Date().toISOString()
                        };
                        existingBookings.unshift(clientBookingRecord);
                        localStorage.setItem(userScopedKey, JSON.stringify(existingBookings));
                    } catch (lsErr) {
                        console.warn("User-scoped storage notice:", lsErr);
                    }
                }

                // Hide overlay
                if (processingOverlay) {
                    processingOverlay.classList.remove("show");
                    processingOverlay.setAttribute("aria-hidden", "true");
                }

                // Update Step 3 Confirmation DOM
                stepperStep2.classList.remove("active");
                stepperStep2.classList.add("completed");
                stepperDiv2.classList.add("active");
                stepperStep3.classList.add("active");

                if (confirmedBookingId) confirmedBookingId.textContent = assignedBookingId;
                if (confirmGuestName) confirmGuestName.textContent = payload.guestDetails.fullName;
                if (confirmGuestEmail) confirmGuestEmail.textContent = payload.guestDetails.email;
                if (confirmDates) {
                    const dIn = new Date(payload.checkIn).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
                    const dOut = new Date(payload.checkOut).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
                    confirmDates.textContent = `${dIn} &rarr; ${dOut}`;
                }
                if (confirmNights) {
                    confirmNights.textContent = `${payload.nights} night(s) • ${payload.guests.total} guest(s) • ${roomsCount} room(s)`;
                }
                if (confirmTotalPaid) {
                    confirmTotalPaid.textContent = `₹ ${payload.pricing.totalAmount.toLocaleString("en-IN")}`;
                }

                if (confirmedVoucherLink) {
                    const qParams = new URLSearchParams({
                        name: payload.guestDetails.fullName,
                        email: payload.guestDetails.email,
                        phone: payload.guestDetails.phone,
                        checkIn: payload.checkIn,
                        checkOut: payload.checkOut,
                        nights: payload.nights,
                        guests: payload.guests.total,
                        rooms: roomsCount,
                        total: payload.pricing.totalAmount,
                        base: payload.pricing.baseTotal,
                        taxes: payload.pricing.taxes,
                        method: payload.payment.method,
                        listingTitle: listingTitle,
                        location: listingLocation
                    });
                    confirmedVoucherLink.href = `/bookings/${assignedBookingId}/voucher?${qParams.toString()}`;
                }

                // Swap views
                stagePayment.style.display = "none";
                stageConfirmation.style.display = "block";
                window.scrollTo({ top: 0, behavior: "smooth" });

            }, 1600);
        });
    }

    // -------------------------------------------------------------
    // 5. COPY BOOKING ID TO CLIPBOARD
    // -------------------------------------------------------------
    if (copyBookingIdBtn && confirmedBookingId) {
        copyBookingIdBtn.addEventListener("click", () => {
            const code = confirmedBookingId.textContent.trim();
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(code).then(() => {
                    const origHtml = copyBookingIdBtn.innerHTML;
                    copyBookingIdBtn.innerHTML = '<i class="fa-solid fa-check text-success"></i>';
                    setTimeout(() => { copyBookingIdBtn.innerHTML = origHtml; }, 2000);
                });
            }
        });
    }
});
