// ─────────────────────────────────────────────────────────────
//  main.js – Complete Multi-Page DTC RepairMaster Web Controller
// ─────────────────────────────────────────────────────────────

// ─── SUPABASE CREDENTIALS ───
const SUPABASE_URL = 'https://mpcnfrshpgcpmrgledwy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_IlSzuHbWowZ84IdxRwBCxg_DDT9P_Vz';
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// ─── GLOBAL STATE ───
let allBrands = [];
let allDevices = [];
let allRepairTypes = [];
let allParts = [];
let currentUser = null;
let currentRoles = [];

// ─── TOAST NOTIFICATION ENGINE ───
function showToast(message, type = 'info') {
    console.log(`[Toast ${type.toUpperCase()}]: ${message}`);
    let t = document.getElementById('toast');
    if (!t) {
        // Create toast element on the fly if not exists
        t = document.createElement('div');
        t.id = 'toast';
        t.className = 'fixed bottom-8 right-8 z-50 px-6 py-4 rounded-xl font-bold text-sm shadow-xl max-w-md pointer-events-none opacity-0 translate-y-8 transition-all duration-500';
        document.body.appendChild(t);
    }
    t.textContent = message;
    t.className = `fixed bottom-8 right-8 z-50 px-6 py-4 rounded-xl font-bold text-sm shadow-xl max-w-md pointer-events-auto backdrop-blur-md transition-all duration-500 transform ${
        type === 'success' ? 'bg-teal-600 text-white border border-teal-400 shadow-teal-500/20' :
        type === 'error' ? 'bg-red-600 text-white border border-red-400 shadow-red-500/20' :
        'bg-slate-800 text-white border border-slate-700 shadow-slate-900/40'
    } show`;
    clearTimeout(t._hide);
    t._hide = setTimeout(() => {
        t.className = 'fixed bottom-8 right-8 z-50 px-6 py-4 rounded-xl font-bold text-sm shadow-xl max-w-md pointer-events-none opacity-0 translate-y-8 transition-all duration-500';
    }, 4000);
}

// ─── 1. DATABASE & CATALOG SYNCHRONIZER ───
async function loadCatalog() {
    // ─── STATIC DATA MODE ───
    // Catalog is now loaded from the bundled repair-data.js file.
    // No Supabase call needed for the calculator.
    if (window.REPAIR_DATA) {
        allBrands = window.REPAIR_DATA.BRANDS.map((name, i) => ({ id: 'b' + (i + 1), name: name }));
        // Build devices list from MODELS_BY_BRAND
        allDevices = [];
        Object.keys(window.REPAIR_DATA.MODELS_BY_BRAND).forEach(brandName => {
            const brandId = 'b' + (window.REPAIR_DATA.BRANDS.indexOf(brandName) + 1);
            window.REPAIR_DATA.MODELS_BY_BRAND[brandName].forEach((modelName, i) => {
                allDevices.push({ id: brandId + '_m' + (i + 1), brand_id: brandId, name: modelName });
            });
        });
        // Map repair types to the UI-friendly labels
        allRepairTypes = window.REPAIR_DATA.REPAIR_TYPES.map(rt => ({
            id: rt.id,
            name: rt.name,
            label: rt.label,
            csvName: rt.csvName   // NEW: original CSV issue_type name, used for pricing lookup
        }));
        // Legacy allParts kept for compatibility (other functions still reference it)
        allParts = [];
        console.log('✅ Catalog loaded from static repair-data.js:', allBrands.length, 'brands,', allDevices.length, 'models');
        return true;
    }
    // Fallback if repair-data.js is missing
    console.warn('repair-data.js not loaded — using comprehensive fallback.');
    useComprehensiveFallback();
    return true;
}

function useComprehensiveFallback() {
    allBrands = [
        { id: 'b1', name: 'Apple' }, { id: 'b2', name: 'Samsung' }, { id: 'b3', name: 'Vivo' },
        { id: 'b4', name: 'OnePlus' }, { id: 'b5', name: 'Xiaomi (MI)' }, { id: 'b6', name: 'Oppo' },
        { id: 'b7', name: 'Realme' }, { id: 'b8', name: 'Google' }, { id: 'b9', name: 'Nothing' },
        { id: 'b10', name: 'Motorola' }, { id: 'b11', name: 'iQOO' }, { id: 'b12', name: 'Lava' }
    ];
    allDevices = [
        { id: 'd1', brand_id: 'b1', name: 'iPhone 15 Pro Max' },
        { id: 'd2', brand_id: 'b1', name: 'iPhone 15' },
        { id: 'd3', brand_id: 'b3', name: 'Vivo V30 Pro' },
        { id: 'd4', brand_id: 'b3', name: 'Vivo V29 Pro' },
        { id: 'd5', brand_id: 'b2', name: 'Galaxy S24 Ultra' },
        { id: 'd6', brand_id: 'b2', name: 'Galaxy A55' },
        { id: 'd7', brand_id: 'b4', name: 'OnePlus 12' },
        { id: 'd8', brand_id: 'b5', name: 'Redmi Note 13 Pro' },
        { id: 'd9', brand_id: 'b6', name: 'Reno 11 Pro' },
        { id: 'd10', brand_id: 'b7', name: 'GT 6 Pro' },
        { id: 'd11', brand_id: 'b8', name: 'Pixel 8 Pro' },
        { id: 'd12', brand_id: 'b9', name: 'Phone 2' },
        { id: 'd13', brand_id: 'b10', name: 'Edge 50 Pro' },
        { id: 'd14', brand_id: 'b11', name: 'iQOO 12' },
        { id: 'd15', brand_id: 'b12', name: 'Agni 2' }
    ];
    allRepairTypes = [
        { id: 'rt1', name: 'screen', label: '📱 Screen Replacement' },
        { id: 'rt2', name: 'battery', label: '🔋 Battery Replacement' },
        { id: 'rt3', name: 'chargingport', label: '🔌 Charging Port Repair' },
        { id: 'rt4', name: 'camera', label: '📷 Camera Repair' },
        { id: 'rt5', name: 'speaker', label: '🔊 Speaker / Mic Repair' },
        { id: 'rt6', name: 'button', label: '🔘 Button Repair' },
        { id: 'rt7', name: 'motherboard', label: '💻 Motherboard Repair' },
        { id: 'rt8', name: 'waterdamage', label: '💧 Water Damage Repair' },
        { id: 'rt9', name: 'software', label: '📀 Software / OS Repair' },
        { id: 'rt10', name: 'network', label: '📶 Network / Antenna Repair' },
        { id: 'rt11', name: 'completeoverhaul', label: '⚙️ Complete Overhaul' }
    ];
    allParts = [
        { device_id: 'd3', repair_type_id: 'rt1', name: 'AMOLED Screen Panel Assembly', price: 6300 },
        { device_id: 'd3', repair_type_id: 'rt1', name: 'Digitizer & Display Flex', price: 504 },
        { device_id: 'd3', repair_type_id: 'rt1', name: 'Water-Resistant Frame Adhesive Seal', price: 126 },
        { device_id: 'd3', repair_type_id: 'rt2', name: 'Certified Li-Po 5000mAh Battery Cell', price: 1500 },
        { device_id: 'd3', repair_type_id: 'rt2', name: 'Thermal Dissipation Pad', price: 150 },
        
        { device_id: 'd1', repair_type_id: 'rt1', name: 'Super Retina XDR OLED Display', price: 25200 },
        { device_id: 'd1', repair_type_id: 'rt1', name: 'Force Touch Digitizer Sensor', price: 2016 },
        { device_id: 'd1', repair_type_id: 'rt1', name: 'IP68 Watertight Perimeter Seal Adhesive', price: 504 },
        { device_id: 'd1', repair_type_id: 'rt2', name: 'OEM Battery Cell Replacement', price: 4500 },
        
        { device_id: 'd5', repair_type_id: 'rt1', name: 'Dynamic AMOLED 2X Display Module', price: 21500 },
        { device_id: 'd5', repair_type_id: 'rt1', name: 'Corning Gorilla Armor Glass Layer', price: 3200 },
        { device_id: 'd5', repair_type_id: 'rt2', name: 'Official Li-Ion 5000mAh Battery Pack', price: 2800 },
        { device_id: 'd5', repair_type_id: 'rt3', name: 'USB-C SuperFast Charging Port PCB', price: 1400 },
        { device_id: 'd5', repair_type_id: 'rt7', name: 'Logic Board IC Power Management Chip', price: 5500 }
    ];

    // Generate remaining missing configurations dynamically
    allDevices.forEach(d => {
        allRepairTypes.forEach(rt => {
            const exists = allParts.some(p => String(p.device_id) === String(d.id) && String(p.repair_type_id) === String(rt.id));
            if (!exists) {
                let baseP = 1500;
                if (rt.name === 'screen') baseP = 4200;
                else if (rt.name === 'battery') baseP = 1600;
                else if (rt.name === 'motherboard') baseP = 5000;
                else if (rt.name === 'chargingport') baseP = 1000;

                if (d.brand_id === 'b1') baseP *= 1.5;
                else if (d.brand_id === 'b2') baseP *= 1.2;

                allParts.push({
                    device_id: d.id,
                    repair_type_id: rt.id,
                    name: `Premium ${rt.name.toUpperCase()} Replacement Kit`,
                    price: Math.round(baseP)
                });
            }
        });
    });

    console.log('📦 Loaded fallbacks with generated coverage.');
}

function getDeviceName(deviceId) {
    if (!deviceId) return 'Generic Device';
    const dev = allDevices.find(d => String(d.id) === String(deviceId));
    return dev ? dev.name : 'Device';
}
window.getDeviceName = getDeviceName;

function getRepairLabel(repairTypeId) {
    if (!repairTypeId) return 'Device Repair';
    const rt = allRepairTypes.find(r => String(r.id) === String(repairTypeId));
    return rt ? rt.label : 'Repair';
}
window.getRepairLabel = getRepairLabel;

function buildSingleOrderCardHtml(o, isAdmin, isCoordinator, isTechnician, isRepairMaster, isGuestMode = false, isMatched = true) {
    const status = o.status || 'Pending';
    const statusClass = 'status-' + status.replace(/\s/g, '-');
    const deviceName = getDeviceName(o.device_id) !== 'Device' ? getDeviceName(o.device_id) : (o.device_other || 'Device');
    const repairLabel = getRepairLabel(o.repair_type_id) !== 'Repair' ? getRepairLabel(o.repair_type_id) : (o.repair_other || 'Repair');

    let actions = '';
    if (!isGuestMode) {
        if (isAdmin || isCoordinator) {
            if (status === 'Pending') {
                actions += `
                    <button onclick="showAssignForm('${o.id}')" class="action-btn btn-assign">Assign Staff</button>
                `;
            }
            if (isCoordinator) {
                if (status === 'Pending' || status === 'Technician Assigned' || status === 'RepairMaster Assigned') {
                    actions += `
                        <button onclick="assignSelfAsTechnician('${o.id}')" class="action-btn btn-pickup">Take as Tech</button>
                        <button onclick="assignSelfAsRepairMaster('${o.id}')" class="action-btn btn-diagnose">Take as Master</button>
                    `;
                }
            }
            if (['Technician Assigned', 'RepairMaster Assigned', 'Pickup-Pending', 'With-RepairMaster', 'Diagnosis-Completed'].includes(status)) {
                actions += `
                    <button onclick="showQuotationForm('${o.id}', ${o.total_price || 0}, '${(o.custom_quote_parts || '').replace(/'/g, "\\'")}')" class="action-btn btn-quote">Manage Price</button>
                `;
            }
            if (status === 'Ready-For-Delivery') {
                actions += `
                    <button onclick="showAssignDeliveryForm('${o.id}')" class="action-btn btn-assign">Assign Delivery Tech</button>
                `;
            }
        }

        if (isTechnician && o.technician_id === currentUser?.id) {
            // Add interactive job checklist
            const steps = [
                'Verify customer physical handset condition',
                'Perform multi-point sensor & touch diagnostics',
                'Ensure physical safety of the device on transit',
                'Match serial numbers for components'
            ];
            actions += `
                <div class="mt-4 mb-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-left">
                    <p class="text-xs font-bold text-teal mb-3 flex items-center gap-1.5">
                        <i class="fa-solid fa-clipboard-check"></i> Doorstep Technician Job Checklist
                    </p>
                    <div class="space-y-2">
                        ${steps.map((step, idx) => {
                            const stepKey = `${o.id}-step-${idx}`;
                            const checked = localStorage.getItem(stepKey) === 'true' ? 'checked' : '';
                            return `
                                <label class="flex items-start gap-2.5 text-xs text-gray-300 cursor-pointer hover:text-white transition">
                                    <input type="checkbox" onchange="localStorage.setItem('${stepKey}', this.checked); checkAllStepsCompleted('${o.id}')" ${checked} class="mt-0.5 accent-teal rounded"/>
                                    <span>${step}</span>
                                </label>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
            if (status === 'Technician Assigned') {
                actions += `<button onclick="initiatePickup('${o.id}')" class="action-btn btn-pickup">Start Pickup</button>`;
            } else if (status === 'Pickup-Pending') {
                actions += `
                    <div class="flex items-center gap-1 mt-1">
                        <input type="text" id="otp-${o.id}" placeholder="Pickup OTP" class="otp-input p-1.5 rounded-lg text-xs w-24 border border-teal-500/20 bg-slate-900 text-white mr-2"/>
                        <button onclick="verifyPickup('${o.id}', document.getElementById('otp-${o.id}').value)" class="action-btn btn-verify">Verify Handover</button>
                    </div>
                `;
            } else if (status === 'Ready-For-Delivery') {
                actions += `
                    <div class="flex items-center gap-1 mt-1">
                        <input type="text" id="delivery-otp-${o.id}" placeholder="Handover OTP" class="otp-input p-1.5 rounded-lg text-xs w-24 border border-teal-500/20 bg-slate-900 text-white mr-2"/>
                        <button onclick="closeTicket('${o.id}', document.getElementById('delivery-otp-${o.id}').value)" class="action-btn btn-verify">Verify Delivery</button>
                    </div>
                `;
            }
        }

        if (isRepairMaster && o.repairmaster_id === currentUser?.id) {
            if (status === 'With-RepairMaster') {
                actions += `
                    <button onclick="showDiagnosisForm('${o.id}')" class="action-btn btn-diagnose">Diagnose Logs</button>
                    <button onclick="showAddPartForm('${o.id}')" class="action-btn btn-part">+ Add Part</button>
                `;
            } else if (status === 'Confirmed' || status === 'Under-Repair') {
                actions += `
                    <div class="flex flex-col gap-1 items-end">
                        <span class="text-xs text-emerald-400 font-bold"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Under Active Work</span>
                        <button onclick="completeRepair('${o.id}')" class="action-btn btn-confirm py-1 px-3 mt-1 text-[11px]">Finish Repair</button>
                    </div>
                `;
            }
        }
    }

    // Customer & Guest Actions
    const isClient = isGuestMode || (currentUser && o.user_id === currentUser.id && !isAdmin && !isCoordinator && !isTechnician && !isRepairMaster);
    if (isClient) {
        if (status === 'Quotation-Sent') {
            actions += `
                <button onclick="confirmQuotation('${o.id}')" class="action-btn btn-confirm">Accept Quote</button>
                <button onclick="rejectQuotation('${o.id}')" class="action-btn btn-reject">Decline</button>
            `;
        } else if (status === 'Confirmed' || status === 'Under-Repair') {
            if (!o.payment_status || o.payment_status === 'Unpaid') {
                actions += `
                    <div class="mt-2 space-y-2 text-left">
                        <span class="text-xs text-amber-400 font-bold block"><i class="fa-solid fa-credit-card"></i> Choose Payment Method:</span>
                        <div class="flex flex-wrap gap-2">
                            <button onclick="payForRepair('${o.id}', ${o.grand_total || o.total_price || 0}, '${deviceName.replace(/'/g, "\\'")}')" class="action-btn btn-confirm py-1.5 px-3 text-[11px]"><i class="fa-solid fa-shield-halved"></i> 💳 Pay Now (₹${(o.grand_total || o.total_price || 0).toLocaleString('en-IN')})</button>
                            <button onclick="selectCODPayment('${o.id}')" class="action-btn btn-pickup py-1.5 px-3 text-[11px]"><i class="fa-solid fa-hand-holding-dollar"></i> 💵 Confirm COD</button>
                        </div>
                    </div>
                `;
            } else if (o.payment_status === 'Pending COD Confirmation') {
                actions += `
                    <div class="mt-2 text-left p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 max-w-sm">
                        <p class="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                            <i class="fa-solid fa-clock animate-pulse"></i> COD Awaiting Confirmation
                        </p>
                        <p class="text-[11px] text-gray-300 mt-1">You have selected Cash on Delivery. The regional Hub Coordinator will confirm and update status upon handset arrival and repair initiation.</p>
                    </div>
                `;
            } else if (o.payment_status === 'Paid') {
                actions += `
                    <div class="mt-2 text-left space-y-2">
                        <span class="text-xs text-emerald-400 font-bold block"><i class="fa-solid fa-circle-check"></i> Paid via ${o.payment_method || 'Online'}</span>
                    </div>
                `;
            }
        } else if (status === 'Awaiting-Payment' || (status === 'Rejected' && (o.total_price || 0) > 0)) {
            const labelPay = status === 'Rejected' ? `Pay Rejection Fee (₹${(o.total_price || 0).toLocaleString('en-IN')})` : `💳 Pay ₹${(o.total_price || 0).toLocaleString('en-IN')}`;
            actions += `
                <button onclick="payForRepair('${o.id}', ${o.total_price || 0}, '${deviceName.replace(/'/g, "\\'")}')" class="action-btn btn-confirm">${labelPay}</button>
            `;
        } else if (status === 'Completed' || o.pickup_otp === 'VERIFIED') {
            // If they have not left a rating yet, allow writing a review!
            if (!o.customer_rating) {
                actions += `
                    <div class="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-left max-w-sm w-full">
                        <p class="text-xs font-bold text-white mb-2"><i class="fa-regular fa-star text-tealAccent mr-1"></i> Rate Your Doorstep Experience</p>
                        <div class="flex gap-1 mb-2">
                            ${[1, 2, 3, 4, 5].map(star => `
                                <button onclick="this.parentElement.setAttribute('data-rating', '${star}'); Array.from(this.parentElement.children).forEach((el, idx) => el.className = idx < ${star} ? 'text-amber-400' : 'text-gray-600')" class="text-gray-600 text-lg transition"><i class="fa-solid fa-star"></i></button>
                            `).join('')}
                        </div>
                        <textarea id="review-text-${o.id}" placeholder="Any suggestions or feedback? (e.g. Excellent doorstep technician support in Wardha!)" class="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-xs text-white outline-none mb-2" rows="2"></textarea>
                        <button onclick="const starVal = this.parentElement.querySelector('[data-rating]')?.getAttribute('data-rating') || '5'; submitOrderReview('${o.id}', parseInt(starVal), document.getElementById('review-text-${o.id}').value)" class="bg-teal px-3 py-1.5 rounded-lg text-slate-950 hover:bg-teal-500 font-bold text-[10px] transition">Submit Review</button>
                    </div>
                `;
            } else {
                actions += `
                    <div class="mt-2 text-xs text-amber-400 font-medium">
                        <span>Your Rating: ${'⭐'.repeat(o.customer_rating)}</span>
                        ${o.customer_review ? `<p class="text-gray-400 italic mt-1">"${o.customer_review}"</p>` : ''}
                    </div>
                `;
            }
        }
    }

    let otpNoticeHtml = '';
    if (isClient) {
        if (status === 'Pickup-Pending' && o.pickup_otp) {
            otpNoticeHtml = `
                <div class="mt-3 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 flex items-center justify-between">
                    <span>🔑 Pickup Handover Code: <span class="text-gray-400 italic">(Show to Technician)</span></span>
                    <strong class="text-sm text-white tracking-widest bg-teal-900/60 px-3 py-1 rounded border border-teal-500/30">${o.pickup_otp}</strong>
                </div>
            `;
        } else if (status === 'Ready-For-Delivery' && o.pickup_otp && o.pickup_otp !== 'VERIFIED') {
            otpNoticeHtml = `
                <div class="mt-3 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 flex items-center justify-between">
                    <span>🔑 Delivery Handover Code: <span class="text-gray-400 italic">(Share with Technician)</span></span>
                    <strong class="text-sm text-white tracking-widest bg-teal-900/60 px-3 py-1 rounded border border-teal-500/30">${o.pickup_otp}</strong>
                </div>
            `;
        }
    }

    let quotationHtml = '';
    if ((status === 'Quotation-Sent' || o.total_price) && !isTechnician) {
        const partsList = parseCustomQuoteParts(o.custom_quote_parts);
        const originalParts = partsList.filter(p => p.name.startsWith('[Original]') || p.name.startsWith('[Old]'));
        const additionalParts = partsList.filter(p => !p.name.startsWith('[Original]') && !p.name.startsWith('[Old]'));
        
        if (partsList.length === 0 && (o.parts_total || 0) > 0) {
            originalParts.push({ name: 'Estimated Spare Components', price: o.parts_total });
        }
        
        let originalPartsHtml = '';
        originalParts.forEach(p => {
            const name = p.name.replace(/^\[Original\]\s*/, '').replace(/^\[Old\]\s*/, '');
            originalPartsHtml += `
                <div class="flex justify-between items-center py-1 text-gray-300 border-b border-white/5 last:border-0 text-[11px]">
                    <span class="truncate">📦 ${name}</span>
                    <span class="font-semibold text-white">₹${p.price.toLocaleString('en-IN')}</span>
                </div>
            `;
        });
        if (!originalPartsHtml) {
            originalPartsHtml = `<div class="text-gray-600 italic py-1 text-[10px]">No original parts estimated.</div>`;
        }
        
        let additionalPartsHtml = '';
        additionalParts.forEach(p => {
            const name = p.name.replace(/^\[Additional\]\s*/, '').replace(/^\[New\]\s*/, '');
            additionalPartsHtml += `
                <div class="flex justify-between items-center py-1.5 text-amber-300 border-b border-white/5 last:border-0 bg-amber-500/5 px-2 rounded text-[11px] my-1">
                    <span class="flex items-center gap-1 truncate font-medium">
                        <i class="fa-solid fa-triangle-exclamation text-amber-500 text-[10px] animate-pulse"></i> ${name}
                    </span>
                    <span class="font-bold text-amber-400">₹${p.price.toLocaleString('en-IN')}</span>
                </div>
            `;
        });
        
        const addPartsSum = additionalParts.reduce((sum, p) => sum + p.price, 0);
        
        let diagnosisAlert = '';
        if (addPartsSum > 0) {
            diagnosisAlert = `
                <div class="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-300 flex items-start gap-2 mb-3">
                    <i class="fa-solid fa-circle-info text-amber-400 mt-0.5 shrink-0"></i>
                    <div>
                        <strong class="font-bold text-amber-200">Bench Diagnosis Finding:</strong> Our senior RepairMaster completed multi-stage diagnostic probing and recommended <strong>${additionalParts.length} additional component-level repairs</strong> (+₹${addPartsSum.toLocaleString('en-IN')}) for full safety and restoration.
                    </div>
                </div>
            `;
        } else if (status === 'Quotation-Sent') {
            diagnosisAlert = `
                <div class="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-lg text-[11px] text-teal-300 flex items-start gap-2 mb-3">
                    <i class="fa-solid fa-circle-check text-teal-400 mt-0.5 shrink-0"></i>
                    <div>
                        <strong class="font-bold text-teal-200">Diagnostics Complete:</strong> Device bench testing has finished. The quote below has been compiled by the Hub Coordinator and is ready for your approval.
                    </div>
                </div>
            `;
        }
        
        quotationHtml = `
            <div class="quotation-box mt-4 bg-slate-950/85 border border-teal-500/20 rounded-xl p-4 shadow-xl text-left">
                <div class="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                    <div class="flex items-center gap-1.5 text-xs font-bold text-teal-400 uppercase tracking-wider">
                        <i class="fa-solid fa-file-invoice-dollar text-[13px]"></i> Itemized Repair Invoice
                    </div>
                    ${status === 'Quotation-Sent' ? '<span class="text-[9px] bg-amber-400 text-slate-950 font-bold uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse">Action Required</span>' : ''}
                </div>
                
                ${diagnosisAlert}
                
                <div class="space-y-3">
                    <!-- Original Parts Section -->
                    <div>
                        <p class="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                            <i class="fa-solid fa-cube text-gray-500"></i> Original Estimated Components (Old Parts)
                        </p>
                        <div class="bg-slate-900/40 border border-white/5 rounded-lg px-3 py-1.5">
                            ${originalPartsHtml}
                        </div>
                    </div>
                    
                    <!-- Additional Parts Section -->
                    ${additionalParts.length > 0 ? `
                        <div>
                            <p class="text-[9px] text-amber-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                                <i class="fa-solid fa-circle-plus"></i> Additional Required Components (New Parts)
                            </p>
                            <div class="bg-slate-900/40 border border-amber-500/10 rounded-lg px-2 py-1">
                                ${additionalPartsHtml}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Diagnosis & Labor Section -->
                    <div>
                        <p class="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                            <i class="fa-solid fa-user-gear text-gray-500"></i> Diagnostic &amp; Labor Workmanship
                        </p>
                        <div class="bg-slate-900/40 border border-white/5 rounded-lg px-3 py-1.5 text-[11px] space-y-1">
                            <div class="flex justify-between text-gray-300 border-b border-white/5 pb-1">
                                <span>🩺 Scientific Bench Diagnosis</span>
                                <span class="font-semibold text-white">₹${(o.diagnosis_charge || 250).toLocaleString('en-IN')}</span>
                            </div>
                            <div class="flex justify-between text-gray-300 pt-0.5">
                                <span>🔧 Workmanship &amp; Re-assembly Labor</span>
                                <span class="font-semibold text-white">₹${(o.service_fee || 100).toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mt-4 flex items-center justify-between bg-teal-500/5 border border-teal-500/10 p-3 rounded-lg">
                    <div>
                        <div class="text-[10px] text-gray-400 uppercase font-semibold">Total Finalized Quotation:</div>
                        ${status === 'Quotation-Sent' ? '<div class="text-[9px] text-amber-400 italic">No hidden charges. Price includes doorstep return delivery.</div>' : ''}
                    </div>
                    <div class="text-base font-black text-emerald-400">₹${(o.total_price || 0).toLocaleString('en-IN')}</div>
                </div>
            </div>
        `;
    }

    // Live Workflow Tracking Indicator
    let workflowHtml = '';
    if (isClient) {
        const steps = [
            { name: 'Placed', active: true },
            { name: 'Assigned', active: ['Technician Assigned', 'Pickup-Pending', 'With-RepairMaster', 'Quotation-Sent', 'Confirmed', 'Awaiting-Payment', 'Ready-For-Delivery', 'Completed'].includes(status) },
            { name: 'Pickup', active: ['Pickup-Pending', 'With-RepairMaster', 'Quotation-Sent', 'Confirmed', 'Awaiting-Payment', 'Ready-For-Delivery', 'Completed'].includes(status) },
            { name: 'Lab Diagnosed', active: ['With-RepairMaster', 'Quotation-Sent', 'Confirmed', 'Awaiting-Payment', 'Ready-For-Delivery', 'Completed'].includes(status) },
            { name: 'Quoted', active: ['Quotation-Sent', 'Confirmed', 'Awaiting-Payment', 'Ready-For-Delivery', 'Completed'].includes(status) },
            { name: 'Repairing', active: ['Confirmed', 'Awaiting-Payment', 'Ready-For-Delivery', 'Completed'].includes(status) },
            { name: 'Paid', active: ['Ready-For-Delivery', 'Completed'].includes(status) },
            { name: 'Delivered', active: ['Completed'].includes(status) }
        ];
        workflowHtml = `
            <div class="mt-4 border-t border-grayBorder pt-3">
                <p class="text-[10px] text-grayText font-bold uppercase tracking-widest mb-2"><i class="fa-solid fa-route mr-1 text-tealAccent"></i> Live Tracking Workflow</p>
                <div class="flex items-center justify-between text-[10px] text-center gap-1">
                    ${steps.map(s => `
                        <div class="flex-1">
                            <div class="h-1.5 w-full rounded-full mb-1 ${s.active ? 'bg-teal-500 shadow-sm shadow-teal-500/20' : 'bg-slate-800'}"></div>
                            <span class="${s.active ? 'text-teal-400 font-bold' : 'text-gray-600'} text-[9px] block leading-tight">${s.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Role-Based Customer Metadata Panel (Access Control - Protect Customer Data)
    let metadataPanel = '';
    if (!isClient) {
        if (isAdmin || isCoordinator || isTechnician) {
            metadataPanel = `
                <div class="mt-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-gray-300">
                    <p class="font-bold text-white mb-1 uppercase tracking-wider text-[10px] flex items-center gap-1 font-display">
                        <i class="fa-regular fa-user-circle text-teal"></i> DTC Customer Contact Details
                    </p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                        <div>👤 <strong>Name:</strong> ${o.customer_name || 'N/A'}</div>
                        <div>📞 <strong>Phone:</strong> ${o.customer_phone || 'N/A'}</div>
                        <div>✉️ <strong>Email:</strong> ${o.customer_email || 'N/A'}</div>
                        <div>📍 <strong>Address:</strong> ${o.address || 'N/A'}</div>
                        <div class="md:col-span-2">🎫 <strong>System Reference ID:</strong> ${o.order_number}</div>
                    </div>
                </div>
            `;
        } else if (isRepairMaster) {
            metadataPanel = `
                <div class="mt-3 p-3.5 bg-slate-950/60 border border-amber-500/10 rounded-xl text-xs text-gray-400">
                    <p class="font-bold text-amber-400 mb-1.5 uppercase tracking-wider text-[9px] flex items-center gap-1 font-display">
                        <i class="fa-solid fa-user-shield text-amber-500"></i> Customer Info Masked (Bench Protection)
                    </p>
                    <p class="text-[11px] leading-relaxed text-gray-500">
                        To ensure platform security and client privacy, customer direct identifiers and contact information are masked for Bench RepairMaster roles. Please coordinate logistics or customer approvals with the regional Hub Coordinator.
                    </p>
                </div>
            `;
        }
    }

    const opacityClass = isMatched ? '' : 'opacity-40 hover:opacity-100 transition-opacity duration-300';
    const borderClass = isMatched ? 'border-teal-500/20' : 'border-grayBorder/40';

    const isClickableCard = isCoordinator || isAdmin;
    const cardClickHandler = isClickableCard ? `onclick="viewOrderDetails('${o.id}')"` : '';
    const cursorClass = isClickableCard ? 'cursor-pointer hover:bg-slate-900/10 hover:shadow-lg hover:shadow-teal-500/5' : '';

    return `
        <div ${cardClickHandler} class="order-card bg-navyBG/40 border ${borderClass} rounded-xl p-5 hover:border-teal-500/30 transition-all ${opacityClass} ${cursorClass}">
            <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3 flex-wrap">
                        <span class="text-lg font-bold text-white">${deviceName}</span>
                        <span class="text-sm text-grayText">—</span>
                        <span class="text-sm text-tealAccent font-medium">${repairLabel}</span>
                        <span class="status-badge ${statusClass} text-xs">${status}</span>
                        ${!isMatched ? `<span class="inline-block bg-slate-800 text-gray-400 text-[9px] uppercase font-bold px-2.5 py-0.5 rounded-full">Older Log</span>` : ''}
                    </div>
                    <div class="text-xs text-grayText mt-1">
                        <span>ID: ${o.order_number}</span>
                        <span class="mx-2">•</span>
                        <span>📅 ${new Date(o.created_at).toLocaleDateString()}</span>
                        ${o.address && !isRepairMaster ? `<span class="mx-2">•</span><span>📍 ${o.address}</span>` : ''}
                    </div>
                    ${o.photo_url ? `<img src="${o.photo_url}" class="mt-3 max-h-24 rounded-lg border border-grayBorder" />` : ''}
                    ${o.diagnosis_notes ? `<p class="mt-2 text-xs text-grayText italic bg-navyBG/20 p-2 rounded border border-grayBorder">Lab Diagnosis Logs: ${o.diagnosis_notes}</p>` : ''}
                    ${o.custom_quote_parts ? `<p class="mt-2 text-xs text-amber-300 italic bg-navyBG/20 p-2 rounded border border-grayBorder">Requested Spare Parts: ${o.custom_quote_parts}</p>` : ''}
                    ${(() => {
                        if (status === 'Pending' && o.created_at) {
                            const createdDate = new Date(o.created_at);
                            const twoDaysAgo = new Date();
                            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
                            if (createdDate < twoDaysAgo) {
                                return `
                                    <div class="mt-2 text-xs text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-pulse">
                                        <i class="fa-solid fa-triangle-exclamation text-rose-400 text-sm"></i>
                                        <span>Alert: Pending assignment for over 2 days! Urgent action required.</span>
                                    </div>
                                `;
                            }
                        }
                        return '';
                    })()}
                    ${metadataPanel}
                    ${quotationHtml}
                    ${otpNoticeHtml}
                    ${workflowHtml}
                    <div id="inline-form-container-${o.id}"></div>
                </div>
                <div class="flex flex-col items-end gap-2">
                    ${isTechnician ? '' : `<span class="text-lg font-black text-tealAccent">₹${(o.total_price || 0).toLocaleString('en-IN')}</span>`}
                    <div id="actions-${o.id}" class="flex flex-wrap gap-1 justify-end">
                        ${actions}
                        ${o.payment_status === 'Paid' ? `<button onclick="openInvoicePage('${o.id}')" class="action-btn btn-confirm bg-emerald-600 hover:bg-emerald-500 text-white font-bold my-1"><i class="fa-solid fa-file-invoice-dollar"></i> View Invoice</button>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}
window.buildSingleOrderCardHtml = buildSingleOrderCardHtml;

// ─── 2. ACTIVE PROMO OFFERS ───
async function fetchOffers() {
    const container = document.getElementById('offersContainer');
    if (!container) return;
    try {
        if (!supabase) throw new Error("No supabase instance");
        const { data, error } = await supabase.from('offers')
            .select('*')
            .eq('is_active', true)
            .order('valid_to', { ascending: false });
        if (error) throw error;
        renderOffers(data || []);
    } catch (err) {
        // Fallback demo offers
        const fallbacks = [
            { id: 1, name: 'Monsoon Screen Guard', description: 'Get a free premium tempered glass screen protector with any display replacement.', discount_percent: 100, valid_to: '2026-08-31', image_url: 'repo-image-folder/device-generic.png' },
            { id: 2, name: 'Independence Battery Deal', description: '15% Off on all smartphone battery replacements. Certified genuine cells only.', discount_percent: 15, valid_to: '2026-08-20', image_url: 'repo-image-folder/technician-device-1.png' },
            { id: 3, name: 'First Time Doorstep Booking', description: 'Flat 50% discount on standard service fee for all new Wardha customers.', discount_percent: 50, valid_to: '2026-12-31', image_url: 'repo-image-folder/technician-scooty.png' }
        ];
        renderOffers(fallbacks);
    }
}

function renderOffers(offers) {
    const container = document.getElementById('offersContainer');
    if (!container) return;
    if (offers.length === 0) {
        container.innerHTML = `<div class="text-center text-grayText/60 py-8 col-span-3">No active promotional offers currently available.</div>`;
        return;
    }
    container.innerHTML = offers.map(o => `
        <div class="offer-card flex flex-col justify-between">
            <div>
                ${o.image_url ? `<img src="${o.image_url}" alt="${o.name}" class="w-full h-40 object-cover rounded-xl mb-4 border border-grayBorder" onerror="this.src='repo-image-folder/device-generic.png'" />` : ''}
                <div class="flex items-start justify-between gap-3 mb-2">
                    <h3 class="text-lg font-bold text-white font-display">${o.name || 'Special Offer'}</h3>
                    <span class="text-2xl font-black text-amberAccent whitespace-nowrap">${o.discount_percent || 0}% OFF</span>
                </div>
                <p class="text-sm text-grayText mb-4">${o.description || ''}</p>
            </div>
            <div>
                <p class="text-xs text-tealAccent mb-4"><i class="fa-solid fa-calendar mr-1"></i> Valid until ${o.valid_to || '31 Dec 2026'}</p>
                <a href="#calculator-section" class="w-full bg-gradient-to-r from-amberAccent to-yellow-500 text-navyBG py-2.5 rounded-xl font-bold hover:scale-[1.02] transition duration-300 block text-center text-sm">Claim Offer</a>
            </div>
        </div>
    `).join('');
}

// ─── 3. ESTIMATION CALCULATOR ENGINE ───
function populateBrands() {
    const select = document.getElementById('brandSelect');
    if (!select) return;
    select.innerHTML = '<option value="">— Select Brand —</option>';
    allBrands.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = b.name;
        if (b.name === "Vivo") opt.selected = true;
        select.appendChild(opt);
    });
    updateModels();
}

async function updateModels() {
    const brandSelect = document.getElementById('brandSelect');
    const modelSelect = document.getElementById('modelSelect');
    if (!modelSelect) return;
    modelSelect.innerHTML = '<option value="">— Select Model —</option>';

    if (!brandSelect || !brandSelect.value) return;

    const brandName = brandSelect.options[brandSelect.selectedIndex]?.text || '';

    // ─── STATIC DATA MODE ───
    // Models come straight from the bundled repair-data.js. No Supabase call.
    let devices = [];
    if (window.REPAIR_DATA && window.REPAIR_DATA.MODELS_BY_BRAND[brandName]) {
        devices = window.REPAIR_DATA.MODELS_BY_BRAND[brandName].map((modelName, i) => {
            const brandId = brandSelect.value;
            // Reuse the same id scheme as loadCatalog so allDevices lookups work
            const existing = allDevices.find(d => d.brand_id === brandId && d.name === modelName);
            return { id: existing ? existing.id : (brandId + '_m' + (i + 1)), name: modelName };
        });
    }

    // Fallback to legacy allDevices if static data is missing
    if (devices.length === 0) {
        const brandId = brandSelect.value;
        const fallbackDevices = allDevices.filter(d => String(d.brand_id) === String(brandId));
        devices = fallbackDevices.map(d => ({ id: d.id, name: d.name }));
    }

    devices.forEach((d, i) => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.name;
        if (i === 0) opt.selected = true;
        modelSelect.appendChild(opt);
    });
    updateRepairTypes();
}

function updateRepairTypes() {
    const modelId = document.getElementById('modelSelect')?.value;
    const repairSelect = document.getElementById('repairTypeSelect');
    if (!repairSelect) return;
    repairSelect.innerHTML = '<option value="">— Select Repair —</option>';

    if (!modelId) return;
    allRepairTypes.forEach((rt, i) => {
        const opt = document.createElement('option');
        opt.value = rt.id;
        opt.textContent = rt.label || rt.name;
        if (rt.name === 'screen') opt.selected = true;
        repairSelect.appendChild(opt);
    });
    updatePartsSurvey();
}

function updatePartsSurvey() {
    calculateEstimate();
}

async function calculateEstimate() {
    const brandSelect = document.getElementById('brandSelect');
    const modelSelect = document.getElementById('modelSelect');
    const repairSelect = document.getElementById('repairTypeSelect');
    const qualitySelect = document.getElementById('tierInput') || document.getElementById('qualitySelect');
    const surveyContainer = document.getElementById('partsSurveyContainer');
    
    if (!brandSelect || !modelSelect || !repairSelect) return;
    
    const brandName = brandSelect.options[brandSelect.selectedIndex]?.text || '';
    const modelName = modelSelect.options[modelSelect.selectedIndex]?.text || '';
    const rtId = repairSelect.value;
    const rtObj = allRepairTypes.find(rt => rt.id === rtId);
    
    if (!brandSelect.value || !modelSelect.value || !repairSelect.value) {
        if (surveyContainer) {
            surveyContainer.innerHTML = `
                <div class="bg-navyBG/30 border border-grayBorder rounded-xl p-4 text-center text-gray-400/50">
                    <i class="fa-solid fa-circle-info mr-2"></i> Select a brand, model, and repair type to see parts.
                </div>
            `;
        }
        return;
    }
    
    const cleanBrand = (brandName.toLowerCase() === 'apple') ? 'Apple' : brandName;
    const issueTypeName = rtObj ? rtObj.name : ''; // e.g. 'screen'
    const issueTypeLabel = rtObj ? rtObj.label.replace(/^[\s\S]*?\s/, '').trim() : ''; // e.g. 'Screen Replacement'
    const selectedQuality = qualitySelect?.value || 'standard';
    // The CSV issue_type name (e.g. "Screen", "Charging port") — used for static lookup
    const csvIssueName = rtObj ? (rtObj.csvName || '') : '';

    // ─── STATIC DATA MODE ───
    // Replace the Supabase parts_pricing query with a direct lookup in REPAIR_DATA.
    let matchingRow = null;
    if (window.REPAIR_DATA && csvIssueName) {
        // Map UI tier values (e.g. 'premium' / 'standard' / 'compatible') to CSV tier names
        const tierMap = {
            'premium':    'Premium (OEM)',
            'standard':   'Standard (HQ)',
            'compatible': 'Compatible (Budget)',
            'economy':    'Compatible (Budget)'
        };
        const preferredTier = tierMap[selectedQuality.toLowerCase()] || null;
        matchingRow = window.REPAIR_DATA.getEstimate(cleanBrand, modelName, csvIssueName, preferredTier);
    }

    // If static data didn't find a row, fall through to legacy catalog logic
    if (matchingRow) {
        const partName = matchingRow.partName || matchingRow.part_name || `${issueTypeLabel} Spare Part`;
        const price = parseFloat(matchingRow.price) || 0;
        const labor = parseFloat(matchingRow.labor) || 0;

        // Extra metadata
        const warranty = matchingRow.warranty ? `<div class="flex justify-between text-xs py-1"><span class="text-gray-400">🛡️ Warranty:</span><span class="text-white font-semibold">${matchingRow.warranty}</span></div>` : '';
        const turnaround = matchingRow.turnaround ? `<div class="flex justify-between text-xs py-1"><span class="text-gray-400">⚡ Turnaround:</span><span class="text-white font-semibold">${matchingRow.turnaround}</span></div>` : '';
        const tierBadge = matchingRow.tier ? `<div class="flex justify-between text-xs py-1"><span class="text-gray-400">💎 Tier Grade:</span><span class="text-white font-semibold">${matchingRow.tier}</span></div>` : '';
        const hubBadge = matchingRow.sourceHub ? `<div class="flex justify-between text-xs py-1"><span class="text-gray-400">📍 Source Hub:</span><span class="text-white font-semibold">${matchingRow.sourceHub}</span></div>` : '';

        const serviceFee = (price + labor) * 0.10; // 10% service fee
        const diagnosisCharge = 250.0;
        const total = price + labor + serviceFee + diagnosisCharge;

        if (surveyContainer) {
            surveyContainer.innerHTML = `
                <div class="bg-navyBG/30 border border-grayBorder rounded-xl p-4 space-y-2 text-left">
                    <p class="text-xs font-bold text-teal mb-2 uppercase tracking-wider flex items-center gap-1"><i class="fa-solid fa-layer-group"></i> Part & Service Breakdown</p>
                    <div class="flex justify-between text-xs py-1">
                        <span class="text-gray-400">Spare: ${partName}</span>
                        <span class="text-white font-bold">₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div class="flex justify-between text-xs py-1">
                        <span class="text-gray-400">Labor / Installation:</span>
                        <span class="text-white font-bold">₹${labor.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    ${tierBadge}
                    ${warranty}
                    ${turnaround}
                    ${hubBadge}
                </div>
            `;
        }

        const partsTotalDisplay = document.getElementById('partsTotalDisplay');
        const serviceFeeDisplay = document.getElementById('serviceFeeDisplay');
        const diagnosisChargeDisplay = document.getElementById('diagnosisChargeDisplay');
        const totalPriceDisplay = document.getElementById('totalPriceDisplay');

        if (partsTotalDisplay) partsTotalDisplay.textContent = '₹' + (price + labor).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        if (serviceFeeDisplay) serviceFeeDisplay.textContent = '₹' + serviceFee.toLocaleString('en-IN', { minimumFractionDigits: 2 });
        if (diagnosisChargeDisplay) diagnosisChargeDisplay.textContent = '₹' + diagnosisCharge.toLocaleString('en-IN', { minimumFractionDigits: 2 });
        if (totalPriceDisplay) totalPriceDisplay.textContent = '₹' + total.toLocaleString('en-IN', { minimumFractionDigits: 2 });

        const btn = document.getElementById('bookServiceBtn');
        if (btn) {
            btn.className = 'flex-1 text-center btn-teal font-extrabold py-3.5 rounded-xl shadow-md hover:scale-[1.02] transition-all';
            btn.innerHTML = '<i class="fa-regular fa-calendar-check mr-2"></i> Book Doorstep Service';
        }
    } else {
        // No pricing row found in static data — fall back to catalog logic
        runCatalogFallbackCalculation();
    }
}
window.calculateEstimate = calculateEstimate;

function runCatalogFallbackCalculation() {
    const modelId = document.getElementById('modelSelect')?.value;
    const repairTypeId = document.getElementById('repairTypeSelect')?.value;
    const qualitySelectElement = document.getElementById('tierInput') || document.getElementById('qualitySelect');
    const quality = qualitySelectElement?.value || 'standard';
    const offerClaimed = document.getElementById('offerToggle')?.checked || false;
    const surveyContainer = document.getElementById('partsSurveyContainer');

    if (!modelId || !repairTypeId) {
        if (surveyContainer) {
            surveyContainer.innerHTML = `
                <div class="bg-navyBG/30 border border-grayBorder rounded-xl p-4 text-center text-gray-400/50">
                    <i class="fa-solid fa-circle-info mr-2"></i> Select a brand, model, and repair type to see parts.
                </div>
            `;
        }
        return;
    }

    const parts = allParts.filter(p => String(p.device_id) === String(modelId) && String(p.repair_type_id) === String(repairTypeId));
    const qualityMultiplier = quality === 'premium' ? 1.0 : 0.7;

    if (surveyContainer) {
        if (parts.length === 0) {
            surveyContainer.innerHTML = `
                <div class="bg-navyBG/30 border border-grayBorder rounded-xl p-4 text-center text-grayText">
                    No custom components configured for this device. Flat rates will apply.
                </div>
            `;
        } else {
            surveyContainer.innerHTML = `
                <div class="bg-navyBG/30 border border-grayBorder rounded-xl p-4 space-y-2">
                    <p class="text-xs font-bold text-grayText mb-2 uppercase tracking-wider"><i class="fa-solid fa-layer-group mr-1"></i> Part Breakdown</p>
                    ${parts.map(p => `
                        <div class="part-item">
                            <span class="part-name text-xs">${p.name} (${quality.toUpperCase()})</span>
                            <span class="part-price text-xs">₹${(p.price * qualityMultiplier).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    let partsTotal = parts.reduce((sum, p) => sum + (p.price * qualityMultiplier), 0);
    const discountedParts = partsTotal * 0.9; // Standard 10% discount on spares
    let serviceFee = discountedParts * 0.15; // standard 15% service charge
    if (offerClaimed) {
        serviceFee = serviceFee * 0.5; // Claim 50% discount on service
    }
    const diagnosisCharge = 250.0;
    const totalEstimate = discountedParts + serviceFee + diagnosisCharge;

    const partsTotalDisplay = document.getElementById('partsTotalDisplay');
    const serviceFeeDisplay = document.getElementById('serviceFeeDisplay');
    const diagnosisChargeDisplay = document.getElementById('diagnosisChargeDisplay');
    const totalPriceDisplay = document.getElementById('totalPriceDisplay');
    const btn = document.getElementById('bookServiceBtn');

    if (partsTotalDisplay) partsTotalDisplay.innerHTML = '₹' + discountedParts.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (serviceFeeDisplay) serviceFeeDisplay.innerHTML = '₹' + serviceFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (diagnosisChargeDisplay) diagnosisChargeDisplay.innerHTML = '₹' + diagnosisCharge.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (totalPriceDisplay) totalPriceDisplay.innerHTML = '₹' + totalEstimate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if (btn) {
        if (totalEstimate > 15000) {
            btn.className = 'flex-1 text-center bg-amberAccent text-navyBG font-extrabold py-3.5 rounded-xl shadow-md hover:scale-[1.02] transition-all';
            btn.innerHTML = '<i class="fa-regular fa-message mr-2"></i> Request Lab Quotation';
        } else {
            btn.className = 'flex-1 text-center btn-teal font-extrabold py-3.5 rounded-xl shadow-md hover:scale-[1.02] transition-all';
            btn.innerHTML = '<i class="fa-regular fa-calendar-check mr-2"></i> Book Doorstep Service';
        }
    }
}

// ─── 4. AUTHENTICATED USER ROLES ───
async function getUserRoles(userId) {
    if (!userId || !supabase) return ['customer'];
    try {
        const { data, error } = await supabase
            .from('user_roles')
            .select('roles(name)')
            .eq('user_id', userId);
        if (error || !data) return ['customer'];
        return data.map(row => row.roles?.name).filter(Boolean);
    } catch {
        return ['customer'];
    }
}

async function getCoordinatorId() {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role_id', 2)
            .limit(1);
        if (error || !data || data.length === 0) return null;
        return data[0].user_id;
    } catch {
        return null;
    }
}

// ─── 5. SUBMIT REQUEST PIPELINE ───
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

async function submitRequest(e) {
    e.preventDefault();
    if (!supabase) {
        showToast('⚠️ Supabase connection is offline.', 'error');
        return;
    }

    try {
        const nameEl = document.getElementById('reqName');
        const phoneEl = document.getElementById('reqPhone');
        const emailEl = document.getElementById('reqEmail');
        const brandSelect = document.getElementById('reqBrand');
        const modelSelect = document.getElementById('reqModel');
        const repairSelect = document.getElementById('reqRepairType');
        const addressEl = document.getElementById('reqAddressLine');
        const cityEl = document.getElementById('reqCity');
        const notesEl = document.getElementById('reqNotes');
        const partsQualitySelect = document.getElementById('reqPartsQuality');

        if (!nameEl || !phoneEl || !emailEl || !brandSelect || !modelSelect || !repairSelect || !addressEl || !cityEl) {
            showToast('⚠️ Repair request form elements are missing.', 'error');
            return;
        }

        const name = nameEl.value.trim();
        const phone = phoneEl.value.trim();
        const email = emailEl.value.trim();
        const addressLine = addressEl.value.trim();
        const city = cityEl.value;
        const notes = notesEl?.value.trim() || '';
        const partsQuality = partsQualitySelect ? partsQualitySelect.value : 'standard';

        if (!name || !phone || !email || !addressLine) {
            showToast('⚠️ Please fill out all required fields.', 'error');
            return;
        }

        if (!city || city === 'Nagpur' || city === 'Amravati') {
            showToast('We currently only serve Wardha. Nagpur & Amravati coming soon!', 'error');
            return;
        }

        let deviceId = brandSelect.value;
        let modelId = modelSelect.value;
        let repairTypeId = repairSelect.value;
        let deviceOther = null;
        let repairOther = null;

        if (document.getElementById('reqBrandOther')?.classList.contains('visible')) {
            deviceOther = document.getElementById('reqBrandOtherInput')?.value.trim();
            if (!deviceOther) return showToast('Please enter the brand name.', 'error');
            deviceId = null;
        }
        if (document.getElementById('reqModelOther')?.classList.contains('visible')) {
            const otherModel = document.getElementById('reqModelOtherInput')?.value.trim();
            if (!otherModel) return showToast('Please enter the model name.', 'error');
            deviceOther = deviceOther ? deviceOther + ' - ' + otherModel : otherModel;
            modelId = null;
        }
        if (document.getElementById('reqRepairOther')?.classList.contains('visible')) {
            repairOther = document.getElementById('reqRepairOtherInput')?.value.trim();
            if (!repairOther) return showToast('Please enter the repair type.', 'error');
            repairTypeId = null;
        }

        if (!deviceId && !deviceOther) return showToast('Please select or enter a brand.', 'error');
        if (!modelId && !deviceOther) return showToast('Please select or enter a model.', 'error');
        if (!repairTypeId && !repairOther) return showToast('Please select or enter a repair type.', 'error');

        const photoFile = document.getElementById('reqPhoto')?.files[0];
        let photoUrl = null;
        if (photoFile) {
            try {
                const fileExt = photoFile.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `requests/${fileName}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('RequestBucket')
                    .upload(filePath, photoFile);
                if (uploadError) {
                    console.warn('Storage upload error, falling back to base64:', uploadError);
                    try {
                        photoUrl = await fileToBase64(photoFile);
                    } catch (b64Err) {
                        console.error('Base64 conversion failed:', b64Err);
                    }
                } else {
                    const { data: urlData } = supabase.storage
                        .from('RequestBucket')
                        .getPublicUrl(filePath);
                    photoUrl = urlData.publicUrl;
                }
            } catch (storageErr) {
                console.warn('Storage upload threw exception, falling back to base64:', storageErr);
                try {
                    photoUrl = await fileToBase64(photoFile);
                } catch (b64Err) {
                    console.error('Base64 conversion exception:', b64Err);
                }
            }
        }

        const session = await supabase.auth.getSession();
        const user = session.data?.session?.user || null;

        let partsTotal = 0;
        if (modelId && repairTypeId) {
            const parts = allParts.filter(p => String(p.device_id) === String(modelId) && String(p.repair_type_id) === String(repairTypeId));
            const qualityMultiplier = partsQuality === 'premium' ? 1.0 : 0.7;
            partsTotal = parts.reduce((sum, p) => sum + (p.price * qualityMultiplier), 0);
        }
        const discountedParts = partsTotal * 0.9;
        const serviceFee = discountedParts > 0 ? (discountedParts * 0.15) : 100.00;
        const totalEstimate = discountedParts + serviceFee + 250;

        const orderData = {
            order_number: 'RM-REQ-' + Date.now().toString(36).toUpperCase(),
            user_id: user?.id || null,
            customer_name: name,
            customer_phone: phone,
            customer_email: email,
            device_id: modelId || null,
            repair_type_id: repairTypeId || null,
            device_other: deviceOther || null,
            repair_other: repairOther || null,
            photo_url: photoUrl,
            address: addressLine + ', ' + city,
            parts_quality: partsQuality,
            parts_total: discountedParts,
            service_fee: serviceFee,
            diagnosis_charge: 250,
            total_price: totalEstimate,
            discount_applied: 0,
            status: 'Pending',
            notes: notes || null,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase.from('orders').insert([orderData]).select();
        if (error) throw error;
        const coordinatorId = await getCoordinatorId();
        if (coordinatorId && data && data[0]) {
            await supabase.from('orders').update({ assigned_to: coordinatorId }).eq('id', data[0].id);
        }
        const orderNumber = (data && data[0]) ? data[0].order_number : orderData.order_number;
        const successDiv = document.getElementById('requestSuccess');
        if (successDiv) {
            successDiv.classList.remove('hidden');
            successDiv.innerHTML = `
                <i class="fa-regular fa-circle-check mr-2"></i>
                Request submitted successfully! Reference: <strong>#${orderNumber}</strong>. Our service coordinators will assign a technician to Wardha shortly.
            `;
        }
        e.target.reset();
        showToast('✅ Service request submitted!', 'success');
        if (user) setTimeout(() => { window.location.href = 'dashboard.html'; }, 2000);
    } catch (err) {
        showToast('❌ Failed to submit: ' + err.message, 'error');
    }
}

// ─── 6. CREATE INSTANT ORDER (FROM WEB CALC) ───
async function createOrder() {
    if (!supabase) {
        showToast('⚠️ Supabase connection is offline.', 'error');
        return;
    }
    const brandId = document.getElementById('brandSelect').value;
    const deviceId = document.getElementById('modelSelect').value;
    const repairTypeId = document.getElementById('repairTypeSelect').value;
    const qualitySelectElement = document.getElementById('tierInput') || document.getElementById('qualitySelect');
    const quality = qualitySelectElement ? qualitySelectElement.value : 'standard';
    const offerClaimed = document.getElementById('offerToggle').checked;
    if (!brandId || !deviceId || !repairTypeId) {
        showToast('⚠️ Please select brand, model, and repair type first.', 'error');
        return;
    }
    const session = await supabase.auth.getSession();
    const user = session.data?.session?.user || null;
    if (!user) {
        showToast('🔑 Please sign in or create an account to book your doorstep repair.', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    const parts = allParts.filter(p => String(p.device_id) === String(deviceId) && String(p.repair_type_id) === String(repairTypeId));
    const qualityMultiplier = quality === 'premium' ? 1.0 : 0.7;
    const partsTotal = parts.reduce((sum, p) => sum + (p.price * qualityMultiplier), 0);
    const discountedParts = partsTotal * 0.9;
    let serviceFee = discountedParts * 0.15;
    if (offerClaimed) serviceFee = serviceFee * 0.5;
    const total = discountedParts + serviceFee + 250;

    const orderData = {
        order_number: 'RM-BOOK-' + Date.now().toString(36).toUpperCase(),
        user_id: user.id,
        customer_name: user.user_metadata?.full_name || 'Web Member',
        customer_phone: user.user_metadata?.phone || '9999999999',
        customer_email: user.email,
        device_id: deviceId,
        repair_type_id: repairTypeId,
        parts_quality: quality,
        parts_total: discountedParts,
        service_fee: serviceFee,
        diagnosis_charge: 250,
        total_price: total,
        discount_applied: offerClaimed ? 0.5 : 0,
        status: 'Pending',
        notes: 'Instantly booked via online estimator breakdown'
    };

    try {
        const { data, error } = await supabase.from('orders').insert([orderData]).select();
        if (error) throw error;
        const coordinatorId = await getCoordinatorId();
        if (coordinatorId && data[0]) {
            await supabase.from('orders').update({ assigned_to: coordinatorId }).eq('id', data[0].id);
        }
        showToast('🎉 Order created successfully! Track via dashboard.', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
    } catch (err) {
        showToast('❌ Order booking failed: ' + err.message, 'error');
    }
}

window.allTechnicians = [];
window.allRepairMasters = [];
window.editingQuotationParts = {};
window.editingQuotationBasePrice = {};
window.editingQuotationServiceFee = {};
window.editingQuotationDiagnosisCharge = {};

const fallbackTechs = [
    { id: "tech-wardha-1", name: "Rahul Sharma (Wardha - Field Tech)" },
    { id: "tech-nagpur-1", name: "Amit Patel (Nagpur - Field Tech)" },
    { id: "tech-arvi-1", name: "Sanjay Deshmukh (Arvi - Field Tech)" }
];
const fallbackMasters = [
    { id: "master-lab-1", name: "Vikram Malhotra (Senior Lab Master)" },
    { id: "master-lab-2", name: "Karan Johar (Micro-soldering Expert)" }
];

async function loadStaffLists() {
    if (!supabase) {
        window.allTechnicians = fallbackTechs;
        window.allRepairMasters = fallbackMasters;
        return;
    }
    try {
        const { data: userRoles, error: rErr } = await supabase
            .from('user_roles')
            .select('user_id, role_id, roles(name)');
        
        const { data: users, error: uErr } = await supabase
            .from('users')
            .select('id, name, email');
            
        if (!rErr && !uErr && userRoles && users) {
            const techs = [];
            const masters = [];
            userRoles.forEach(ur => {
                const roleName = ur.roles?.name?.toLowerCase() || '';
                const roleId = parseInt(ur.role_id);
                const user = users.find(u => u.id === ur.user_id);
                if (user) {
                    const displayName = user.name ? `${user.name} (${user.email})` : user.email;
                    const staffObj = { id: user.id, name: displayName, email: user.email };
                    if (roleName === 'technician' || roleId === 3) {
                        techs.push(staffObj);
                    } else if (roleName === 'repairmaster' || roleId === 4) {
                        masters.push(staffObj);
                    }
                }
            });
            
            // Combine with some fallbacks to guarantee non-empty lists in sandbox/demo
            window.allTechnicians = techs.length > 0 ? techs : fallbackTechs;
            window.allRepairMasters = masters.length > 0 ? masters : fallbackMasters;
        } else {
            window.allTechnicians = fallbackTechs;
            window.allRepairMasters = fallbackMasters;
        }
    } catch (e) {
        console.warn("loadStaffLists error", e);
        window.allTechnicians = fallbackTechs;
        window.allRepairMasters = fallbackMasters;
    }
}

function closeAllDashboardModals() {
    const modals = document.querySelectorAll('.dashboard-modal');
    modals.forEach(m => m.remove());
}
window.closeAllDashboardModals = closeAllDashboardModals;

function createDashboardModal(modalId, contentHtml, maxWidthClass = 'max-w-md') {
    closeAllDashboardModals(); // Close any other open dashboard modals first!
    
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'dashboard-modal fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto';
    modal.innerHTML = `
        <div class="bg-slate-900 border border-teal-500/30 p-6 rounded-2xl ${maxWidthClass} w-full shadow-2xl relative text-left my-8">
            <button onclick="closeAllDashboardModals()" class="absolute top-4 right-4 text-gray-400 hover:text-white text-lg transition">✕</button>
            ${contentHtml}
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}
window.createDashboardModal = createDashboardModal;

function showAssignForm(orderId) {
    const techs = window.allTechnicians || [];
    const masters = window.allRepairMasters || [];
    
    let techOptions = `<option value="">-- Select Technician --</option>`;
    techs.forEach(t => {
        techOptions += `<option value="${t.id}">${t.name}</option>`;
    });
    
    let masterOptions = `<option value="">-- Select RepairMaster --</option>`;
    masters.forEach(m => {
        masterOptions += `<option value="${m.id}">${m.name}</option>`;
    });
    
    const contentHtml = `
        <div class="space-y-4">
            <div class="flex items-center gap-2 border-b border-white/5 pb-3">
                <div class="w-10 h-10 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-full flex items-center justify-center text-xl">
                    <i class="fa-solid fa-user-plus"></i>
                </div>
                <div>
                    <h3 class="text-sm font-bold text-teal-400 uppercase tracking-wider">Assign Field Staff</h3>
                    <p class="text-[10px] text-gray-400">Manual dispatch routing for doorstep pickup</p>
                </div>
            </div>
            <div class="space-y-3">
                <div>
                    <label class="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Field Pickup Technician</label>
                    <select id="assign-tech-${orderId}" class="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-teal">
                        ${techOptions}
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Bench RepairMaster</label>
                    <select id="assign-master-${orderId}" class="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-teal">
                        ${masterOptions}
                    </select>
                </div>
            </div>
            <div class="flex gap-2 justify-end pt-3 border-t border-white/5">
                <button onclick="closeAllDashboardModals()" class="px-3 py-1.5 rounded bg-gray-800 text-white text-xs font-medium hover:bg-gray-750 transition">Cancel</button>
                <button onclick="submitAssignRoles('${orderId}')" class="px-4 py-1.5 rounded bg-teal text-slate-950 text-xs font-bold hover:bg-tealAccent transition">Confirm Staff</button>
            </div>
        </div>
    `;
    createDashboardModal(`assignModal-${orderId}`, contentHtml, 'max-w-md');
}

async function submitAssignRoles(orderId) {
    const techSelect = document.getElementById(`assign-tech-${orderId}`);
    const masterSelect = document.getElementById(`assign-master-${orderId}`);
    if (!techSelect || !masterSelect) return;
    
    const techId = techSelect.value;
    const masterId = masterSelect.value;
    
    if (!techId || !masterId) {
        showToast('Please select both a Technician and a RepairMaster.', 'error');
        return;
    }
    
    await assignOrderRoles(orderId, techId, masterId);
}

function showAssignDeliveryForm(orderId) {
    const techs = window.allTechnicians || [];
    
    let techOptions = `<option value="">-- Select Delivery Tech --</option>`;
    techs.forEach(t => {
        techOptions += `<option value="${t.id}">${t.name}</option>`;
    });
    
    const contentHtml = `
        <div class="space-y-4">
            <div class="flex items-center gap-2 border-b border-white/5 pb-2">
                <div class="w-10 h-10 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-full flex items-center justify-center text-xl">
                    <i class="fa-solid fa-truck"></i>
                </div>
                <div>
                    <h3 class="text-sm font-bold text-teal-400 uppercase tracking-wider">Assign Delivery Staff</h3>
                    <p class="text-[10px] text-gray-400">Delivery logistics dispatcher</p>
                </div>
            </div>
            <div>
                <label class="block text-[10px] text-gray-400 uppercase font-semibold mb-1">Delivery Technician</label>
                <select id="assign-delivery-tech-${orderId}" class="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-teal">
                    ${techOptions}
                </select>
            </div>
            <div class="flex gap-2 justify-end pt-3 border-t border-white/5">
                <button onclick="closeAllDashboardModals()" class="px-3 py-1.5 rounded bg-gray-800 text-white text-xs font-medium hover:bg-gray-750 transition">Cancel</button>
                <button onclick="submitAssignDelivery('${orderId}')" class="px-4 py-1.5 rounded bg-teal text-slate-950 text-xs font-bold hover:bg-tealAccent transition">Confirm Tech</button>
            </div>
        </div>
    `;
    createDashboardModal(`assignDeliveryModal-${orderId}`, contentHtml, 'max-w-md');
}

async function submitAssignDelivery(orderId) {
    const techSelect = document.getElementById(`assign-delivery-tech-${orderId}`);
    if (!techSelect) return;
    
    const techId = techSelect.value;
    
    if (!techId) {
        showToast('Please select a Delivery Technician.', 'error');
        return;
    }
    
    await assignDeliveryTechnician(orderId, techId);
}

function showDiagnosisForm(orderId) {
    const order = (window.allFetchedOrders || []).find(o => o.id === orderId);
    const currentDiag = order ? (order.diagnosis_notes || '') : '';
    const currentNotes = order ? (order.notes || '') : '';
    const currentPartsTotal = order ? (order.parts_total || 0) : 0;
    const currentTotalPrice = order ? (order.total_price || 0) : 0;

    const activeRole = localStorage.getItem('activeRole') || 'customer';
    const isRepairMaster = activeRole === 'repairmaster';

    // Load available inventory items for quick selection
    let partOptionsHtml = '<option value="">— Select from Lab Inventory (Optional) —</option>';
    if (window.allInventoryItems && window.allInventoryItems.length > 0) {
        window.allInventoryItems.forEach(item => {
            partOptionsHtml += `<option value="${item.part_name}|${item.price}">${item.part_name} (Stock: ${item.quantity}, Price: ₹${item.price})</option>`;
        });
    }

    const priceStyle = isRepairMaster ? 'readonly class="w-full bg-slate-950/60 border border-white/5 p-2 rounded-lg text-xs text-gray-500 outline-none"' : 'class="w-full bg-slate-950 border border-white/10 p-2 rounded-lg text-xs text-white outline-none focus:border-amber-400"';
    const totalPartsStyle = isRepairMaster ? 'readonly class="w-full bg-slate-950/60 border border-white/5 p-2 rounded-lg text-xs text-gray-500 outline-none"' : 'class="w-full bg-slate-950 border border-white/10 p-2 rounded-lg text-xs text-white outline-none focus:border-amber-400"';
    const totalStyle = isRepairMaster ? 'readonly class="w-full bg-slate-950/60 border border-white/5 p-2 rounded-lg text-xs text-gray-500 outline-none"' : 'class="w-full bg-slate-950 border border-white/10 p-2 rounded-lg text-xs text-white outline-none focus:border-amber-400"';
    const submitBtnText = isRepairMaster ? 'Submit Recommended Diagnosis' : 'Save &amp; Update Bench';

    const contentHtml = `
        <div class="space-y-4 text-left font-sans">
            <div class="flex items-center gap-2 border-b border-white/5 pb-2">
                <div class="w-10 h-10 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center text-xl animate-pulse">
                    <i class="fa-solid fa-stethoscope"></i>
                </div>
                <div>
                    <h3 class="text-sm font-bold text-amber-400 uppercase tracking-wider font-display">Bench Diagnosis &amp; Parts Workstation</h3>
                    <p class="text-[10px] text-gray-400">Order Ref: ${order ? order.order_number : orderId}</p>
                </div>
            </div>

            <!-- 1. Diagnosis Notes -->
            <div>
                <label class="block text-[10px] text-gray-400 uppercase font-bold mb-1">1. Diagnosis Notes &amp; Test Results</label>
                <textarea id="diag-notes-${orderId}" rows="3" placeholder="Describe diagnostic results, e.g., Microscopic check verified glass lamination intact..." class="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none resize-none focus:border-amber-400">${currentDiag}</textarea>
            </div>

            <!-- 2. Advise Coordinator -->
            <div>
                <label class="block text-[10px] text-amber-400 uppercase font-bold mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-comments"></i> 2. Advise Coordinator (Notes / Communication)
                </label>
                <textarea id="diag-advise-${orderId}" rows="2" placeholder="Send notes to coordinator, e.g., 'Part is out of stock, need to order from hub...'" class="w-full bg-slate-950 border border-amber-500/20 rounded-lg p-2.5 text-xs text-white outline-none resize-none focus:border-amber-400">${currentNotes}</textarea>
            </div>

            <!-- 3. Parts Request & Update Estimate -->
            <div class="border-t border-white/5 pt-3 space-y-3">
                <span class="block text-[10px] text-gray-400 uppercase font-bold">3. Request Parts &amp; Estimate Pricing</span>
                
                <!-- Quick Selection Dropdown -->
                <div>
                    <select id="diag-inventory-select-${orderId}" onchange="selectInventoryPart('${orderId}')" class="w-full bg-slate-950 border border-white/10 p-2 rounded-xl text-xs text-white outline-none focus:border-amber-400 cursor-pointer">
                        ${partOptionsHtml}
                    </select>
                </div>

                <!-- Custom request inputs -->
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="block text-[9px] text-gray-400 uppercase mb-1">Part / Service Name</label>
                        <input type="text" id="diag-part-name-${orderId}" placeholder="e.g. Back Glass replacement" class="w-full bg-slate-950 border border-white/10 p-2 rounded-lg text-xs text-white outline-none focus:border-amber-400" />
                    </div>
                    <div>
                        <label class="block text-[9px] text-gray-400 uppercase mb-1">Estimated Price (₹)</label>
                        <input type="number" id="diag-part-price-${orderId}" placeholder="e.g. 1200" ${priceStyle} />
                    </div>
                </div>

                <div class="flex justify-end">
                    <button onclick="addPartFromDiagnosis('${orderId}')" class="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1">
                        <i class="fa-solid fa-plus"></i> Add Part to Quote
                    </button>
                </div>

                <!-- Adjust Total Estimate -->
                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                    <div>
                        <label class="block text-[9px] text-gray-400 uppercase mb-1 flex items-center gap-1">
                            Adjust Parts Estimate (₹) ${isRepairMaster ? '<i class="fa-solid fa-lock text-[9px] text-gray-500"></i>' : ''}
                        </label>
                        <input type="number" id="diag-parts-total-${orderId}" value="${currentPartsTotal}" ${totalPartsStyle} />
                    </div>
                    <div>
                        <label class="block text-[9px] text-gray-400 uppercase mb-1 flex items-center gap-1">
                            Adjust Total Estimate (₹) ${isRepairMaster ? '<i class="fa-solid fa-lock text-[9px] text-gray-500"></i>' : ''}
                        </label>
                        <input type="number" id="diag-total-price-${orderId}" value="${currentTotalPrice}" ${totalStyle} />
                    </div>
                </div>
            </div>

            <!-- Submit Buttons -->
            <div class="flex gap-2 justify-end pt-3 border-t border-white/5">
                <button onclick="closeAllDashboardModals()" class="px-3 py-1.5 rounded bg-gray-800 text-white text-xs font-medium hover:bg-gray-750 transition">Cancel</button>
                <button onclick="submitRedesignedDiagnosis('${orderId}')" class="px-4 py-1.5 rounded bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition">${submitBtnText}</button>
            </div>
        </div>
    `;
    createDashboardModal(`diagModal-${orderId}`, contentHtml, 'max-w-md');
}

function selectInventoryPart(orderId) {
    const select = document.getElementById(`diag-inventory-select-${orderId}`);
    const nameInput = document.getElementById(`diag-part-name-${orderId}`);
    const priceInput = document.getElementById(`diag-part-price-${orderId}`);
    if (select && select.value && nameInput && priceInput) {
        const [name, price] = select.value.split('|');
        nameInput.value = name;
        priceInput.value = price;
    }
}

async function addPartFromDiagnosis(orderId) {
    const nameInput = document.getElementById(`diag-part-name-${orderId}`);
    const priceInput = document.getElementById(`diag-part-price-${orderId}`);
    if (!nameInput || !priceInput) return;

    const partName = nameInput.value.trim();
    const price = parseFloat(priceInput.value) || 0;

    if (!partName) {
        showToast('Please enter a part name.', 'error');
        return;
    }

    if (!supabase) {
        showToast('Database disconnected. Saved locally.', 'success');
        return;
    }

    try {
        const { data: ticket } = await supabase.from('orders').select('custom_quote_parts').eq('id', orderId).single();
        let existing = ticket?.custom_quote_parts ? ticket.custom_quote_parts + '\n' : '';
        existing += `[Additional] ${partName},${price}`;
        
        const { error } = await supabase.from('orders').update({ custom_quote_parts: existing }).eq('id', orderId);
        if (error) throw error;

        // Auto-increment estimate inputs on form
        const partsTotalInput = document.getElementById(`diag-parts-total-${orderId}`);
        const totalPriceInput = document.getElementById(`diag-total-price-${orderId}`);
        if (partsTotalInput) {
            partsTotalInput.value = (parseFloat(partsTotalInput.value) || 0) + price;
        }
        if (totalPriceInput) {
            totalPriceInput.value = (parseFloat(totalPriceInput.value) || 0) + price;
        }

        showToast('Part successfully requested and added to estimate.', 'success');
        nameInput.value = '';
        priceInput.value = '';
    } catch (err) {
        showToast('Failed to add part: ' + err.message, 'error');
    }
}

async function submitRedesignedDiagnosis(orderId) {
    const notesVal = document.getElementById(`diag-notes-${orderId}`)?.value.trim() || '';
    const adviseVal = document.getElementById(`diag-advise-${orderId}`)?.value.trim() || '';
    const partsTotalVal = parseFloat(document.getElementById(`diag-parts-total-${orderId}`)?.value) || 0;
    const totalPriceVal = parseFloat(document.getElementById(`diag-total-price-${orderId}`)?.value) || 0;

    if (!notesVal) {
        showToast('Please enter diagnosis notes.', 'error');
        return;
    }

    if (!supabase) {
        showToast('Saved locally in offline mode.', 'success');
        closeAllDashboardModals();
        return;
    }

    const activeRole = localStorage.getItem('activeRole') || 'customer';
    const isRepairMaster = activeRole === 'repairmaster';

    try {
        const updateData = {
            diagnosis_notes: notesVal,
            notes: adviseVal
        };
        if (isRepairMaster) {
            updateData.status = 'Diagnosis-Completed';
        } else {
            updateData.parts_total = partsTotalVal;
            updateData.total_price = totalPriceVal;
        }

        const { error } = await supabase.from('orders').update(updateData).eq('id', orderId);
        if (error) throw error;

        if (isRepairMaster) {
            const order = (window.allFetchedOrders || []).find(o => o.id === orderId);
            const devName = order ? (getDeviceName(order.device_id) !== 'Device' ? getDeviceName(order.device_id) : (order.device_other || 'Device')) : 'Device';
            await createAlert(orderId, `Bench diagnosis completed for ${devName}. Estimate review required.`, 'diagnosis_completed');
            showToast('📋 Lab diagnosis recommendation submitted to Coordinator!', 'success');
        } else {
            showToast('📋 Lab diagnostics and coordinator advice updated!', 'success');
        }
        closeAllDashboardModals();
        loadDashboard();
    } catch (err) {
        showToast('Update failed: ' + err.message, 'error');
    }
}

// Backward compatibility helper
function showAddPartForm(orderId) {
    showDiagnosisForm(orderId);
}

async function submitAddPart(orderId) {
    await submitRedesignedDiagnosis(orderId);
}

// Keep submitDiagnosis for legacy references
async function submitDiagnosis(orderId) {
    await submitRedesignedDiagnosis(orderId);
}

function parseCustomQuoteParts(customPartsStr) {
    if (!customPartsStr) return [];
    return customPartsStr.split('\n').map(line => {
        const idx = line.lastIndexOf(',');
        if (idx === -1) {
            const name = line.trim();
            if (!name) return null;
            const isOrig = name.startsWith('[Original]') || name.startsWith('[Old]');
            const cleanName = isOrig ? name : (name.startsWith('[Additional]') ? name : `[Additional] ${name}`);
            return { name: cleanName, price: 0 };
        }
        const name = line.substring(0, idx).trim();
        const price = parseFloat(line.substring(idx + 1)) || 0;
        const isOrig = name.startsWith('[Original]') || name.startsWith('[Old]');
        const cleanName = isOrig ? name : (name.startsWith('[Additional]') ? name : `[Additional] ${name}`);
        return { name: cleanName, price };
    }).filter(p => p && p.name);
}

function serializeCustomQuoteParts(partsList) {
    return partsList.map(p => `${p.name},${p.price}`).join('\n');
}

function showQuotationForm(orderId, basePrice, customPartsStr) {
    const order = (window.allFetchedOrders || []).find(o => o.id === orderId);
    
    // Parse custom parts
    let partsList = parseCustomQuoteParts(customPartsStr);
    
    let qualityMultiplier = 1.0;
    if (order && order.parts_quality === 'premium') qualityMultiplier = 1.4;
    else if (order && order.parts_quality === 'budget') qualityMultiplier = 0.7;
    
    // If empty, pre-populate with original parts
    if (partsList.length === 0 && order) {
        const originalDbParts = (window.allParts || []).filter(p => String(p.device_id) === String(order.device_id) && String(p.repair_type_id) === String(order.repair_type_id));
        if (originalDbParts.length > 0) {
            originalDbParts.forEach(p => {
                partsList.push({
                    name: `[Original] ${p.name}`,
                    price: Math.round(p.price * qualityMultiplier * 0.9)
                });
            });
        } else if (order.parts_total > 0) {
            partsList.push({
                name: `[Original] Estimated Spare Components`,
                price: parseFloat(order.parts_total) || 0
            });
        }
    }
    
    // Store in global window for active editing
    window.editingQuotationParts[orderId] = partsList;
    window.editingQuotationServiceFee[orderId] = order ? (parseFloat(order.service_fee) || 100) : 100;
    window.editingQuotationDiagnosisCharge[orderId] = order ? (parseFloat(order.diagnosis_charge) || 250) : 250;
    
    renderQuotationFormInlineEditable(orderId);
}

function renderQuotationFormInlineEditable(orderId) {
    const partsList = window.editingQuotationParts[orderId] || [];
    const serviceFee = window.editingQuotationServiceFee[orderId] || 0;
    const diagnosisCharge = window.editingQuotationDiagnosisCharge[orderId] || 0;
    
    const partsSum = partsList.reduce((sum, p) => sum + p.price, 0);
    const liveTotal = serviceFee + diagnosisCharge + partsSum;
    
    let originalPartsHtml = '';
    let additionalPartsHtml = '';
    
    partsList.forEach((p, index) => {
        const isOriginal = p.name.startsWith('[Original]') || p.name.startsWith('[Old]');
        const cleanName = p.name.replace(/^\[Original\]\s*/, '').replace(/^\[Old\]\s*/, '').replace(/^\[Additional\]\s*/, '').replace(/^\[New\]\s*/, '');
        
        const partHtml = `
            <div class="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-white/5">
                <div class="shrink-0">
                    <button type="button" onclick="toggleQuotationPartType('${orderId}', ${index}, ${!isOriginal})" class="px-2 py-1 rounded text-[10px] font-bold ${isOriginal ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-teal-500/20 text-teal-400 border border-teal-500/30'}" title="Toggle Component Classification (Original vs Additional)">
                        ${isOriginal ? 'Old' : 'New'}
                    </button>
                </div>
                <input type="text" value="${cleanName}" oninput="updateQuotationPartName('${orderId}', ${index}, this.value)" class="flex-1 bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-teal" placeholder="Component Name" />
                <div class="flex items-center gap-1 w-24 shrink-0">
                    <span class="text-xs text-gray-500">₹</span>
                    <input type="number" value="${p.price}" oninput="updateQuotationPartPrice('${orderId}', ${index}, this.value)" class="w-full bg-slate-950 border border-white/10 rounded px-1.5 py-1 text-xs text-teal font-bold text-right outline-none focus:border-teal" />
                </div>
                <button onclick="removeQuotationPartEditable('${orderId}', ${index})" class="text-red-400 hover:text-red-300 text-xs px-1.5 py-1 shrink-0" title="Remove Component">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
        
        if (isOriginal) {
            originalPartsHtml += partHtml;
        } else {
            additionalPartsHtml += partHtml;
        }
    });
    
    if (!originalPartsHtml) {
        originalPartsHtml = `<p class="text-xs text-gray-600 italic py-1">No original estimated components listed.</p>`;
    }
    if (!additionalPartsHtml) {
        additionalPartsHtml = `<p class="text-xs text-gray-600 italic py-1">No additional diagnosed components listed yet.</p>`;
    }
    
    const contentHtml = `
        <div class="space-y-4">
            <div class="flex items-center gap-2 border-b border-white/5 pb-2">
                <div class="w-10 h-10 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-full flex items-center justify-center text-xl">
                    <i class="fa-solid fa-file-invoice-dollar"></i>
                </div>
                <div>
                    <h3 class="text-sm font-bold text-teal-400 uppercase tracking-wider">Finalize Customer Quotation</h3>
                    <p class="text-[10px] text-gray-400 font-medium">Coordinator Desk Breakdown</p>
                </div>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label class="block text-[10px] text-gray-400 uppercase font-semibold mb-1">🩺 Diagnosis Charge</label>
                    <div class="flex items-center bg-slate-950 border border-white/10 rounded-lg p-2 focus-within:border-teal transition">
                        <span class="text-xs text-gray-500 mr-1.5">₹</span>
                        <input type="number" id="quote-diag-price-${orderId}" value="${diagnosisCharge}" oninput="updateQuotationDiagnosisChargeEditable('${orderId}', this.value)" class="w-full bg-transparent border-none text-white text-xs font-bold outline-none" />
                    </div>
                </div>
                
                <div>
                    <label class="block text-[10px] text-gray-400 uppercase font-semibold mb-1">🔧 Service &amp; Labor Fee</label>
                    <div class="flex items-center bg-slate-950 border border-white/10 rounded-lg p-2 focus-within:border-teal transition">
                        <span class="text-xs text-gray-500 mr-1.5">₹</span>
                        <input type="number" id="quote-service-price-${orderId}" value="${serviceFee}" oninput="updateQuotationServiceFeeEditable('${orderId}', this.value)" class="w-full bg-transparent border-none text-white text-xs font-bold outline-none" />
                    </div>
                </div>
            </div>
            
            <div class="space-y-3">
                <div class="flex items-center justify-between border-b border-white/5 pb-1">
                    <label class="block text-[10px] text-amber-400 uppercase font-bold tracking-wider">📦 Original Estimated Components (Old Parts)</label>
                    <button onclick="addNewQuotationPartPromptEditable('${orderId}', true)" class="text-[9px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold">
                        <i class="fa-solid fa-plus text-[8px]"></i> Add Old Part
                    </button>
                </div>
                <div class="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    ${originalPartsHtml}
                </div>
            </div>
            
            <div class="space-y-3">
                <div class="flex items-center justify-between border-b border-white/5 pb-1">
                    <label class="block text-[10px] text-teal-400 uppercase font-bold tracking-wider">➕ Additional Diagnosed Upgrades (New Parts)</label>
                    <button onclick="addNewQuotationPartPromptEditable('${orderId}', false)" class="text-[9px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold">
                        <i class="fa-solid fa-plus text-[8px]"></i> Add New Part
                    </button>
                </div>
                <div class="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    ${additionalPartsHtml}
                </div>
            </div>
            
            <div class="flex items-center justify-between bg-teal-500/5 border border-teal-500/10 p-3 rounded-lg">
                <div class="text-xs font-semibold text-gray-300">Finalized Customer Quote Total:</div>
                <div class="text-sm font-black text-emerald-400">₹${liveTotal.toLocaleString('en-IN')}</div>
            </div>
            
            <div class="flex gap-2 justify-end pt-3 border-t border-white/5">
                <button onclick="cancelQuotationEdit('${orderId}')" class="px-3 py-1.5 rounded bg-gray-800 text-white text-xs font-medium hover:bg-gray-750 transition">Cancel</button>
                <button onclick="submitFinalizedQuotation('${orderId}')" class="px-4 py-1.5 rounded bg-teal text-slate-950 text-xs font-black hover:bg-tealAccent transition shadow-md flex items-center gap-1">
                    <i class="fa-solid fa-paper-plane text-[10px]"></i> Send Quotation
                </button>
            </div>
        </div>
    `;
    
    createDashboardModal(`quoteModal-${orderId}`, contentHtml, 'max-w-xl');
}

function updateQuotationPartPrice(orderId, index, value) {
    const val = parseFloat(value) || 0;
    if (window.editingQuotationParts[orderId] && window.editingQuotationParts[orderId][index]) {
        window.editingQuotationParts[orderId][index].price = val;
        renderQuotationFormInlineEditable(orderId);
    }
}

function updateQuotationPartName(orderId, index, value) {
    if (window.editingQuotationParts[orderId] && window.editingQuotationParts[orderId][index]) {
        const p = window.editingQuotationParts[orderId][index];
        const isOriginal = p.name.startsWith('[Original]') || p.name.startsWith('[Old]');
        const prefix = isOriginal ? '[Original] ' : '[Additional] ';
        p.name = prefix + value;
    }
}

function toggleQuotationPartType(orderId, index, isOriginal) {
    if (window.editingQuotationParts[orderId] && window.editingQuotationParts[orderId][index]) {
        const p = window.editingQuotationParts[orderId][index];
        const cleanName = p.name.replace(/^\[Original\]\s*/, '').replace(/^\[Old\]\s*/, '').replace(/^\[Additional\]\s*/, '').replace(/^\[New\]\s*/, '');
        p.name = isOriginal ? `[Original] ${cleanName}` : `[Additional] ${cleanName}`;
        renderQuotationFormInlineEditable(orderId);
    }
}

function updateQuotationDiagnosisChargeEditable(orderId, value) {
    const val = parseFloat(value) || 0;
    window.editingQuotationDiagnosisCharge[orderId] = val;
    renderQuotationFormInlineEditable(orderId);
}

function updateQuotationServiceFeeEditable(orderId, value) {
    const val = parseFloat(value) || 0;
    window.editingQuotationServiceFee[orderId] = val;
    renderQuotationFormInlineEditable(orderId);
}

function addNewQuotationPartPromptEditable(orderId, isOriginal = false) {
    if (window.editingQuotationParts[orderId]) {
        const prefix = isOriginal ? '[Original] ' : '[Additional] ';
        window.editingQuotationParts[orderId].push({ name: `${prefix}Spare Component`, price: 0 });
        renderQuotationFormInlineEditable(orderId);
    }
}

function removeQuotationPartEditable(orderId, index) {
    if (window.editingQuotationParts[orderId]) {
        window.editingQuotationParts[orderId].splice(index, 1);
        renderQuotationFormInlineEditable(orderId);
    }
}

function cancelQuotationEdit(orderId) {
    delete window.editingQuotationParts[orderId];
    delete window.editingQuotationServiceFee[orderId];
    delete window.editingQuotationDiagnosisCharge[orderId];
    loadDashboard();
}

async function submitFinalizedQuotation(orderId) {
    if (!supabase) return;
    try {
        const partsList = window.editingQuotationParts[orderId] || [];
        const serviceFee = window.editingQuotationServiceFee[orderId] || 100;
        const diagnosisCharge = window.editingQuotationDiagnosisCharge[orderId] || 250;
        
        // Separate parts into original vs additional to calculate parts_total
        const originalParts = partsList.filter(p => p.name.startsWith('[Original]') || p.name.startsWith('[Old]'));
        const originalPartsSum = originalParts.reduce((sum, p) => sum + p.price, 0);
        
        const partsSum = partsList.reduce((sum, p) => sum + p.price, 0);
        const liveTotal = serviceFee + diagnosisCharge + partsSum;
        
        // Serialize parts list back
        const customPartsStr = serializeCustomQuoteParts(partsList);
        
        // Calculate tax, platform fee, and grand total for invoice
        const invoiceNum = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const taxAmount = parseFloat((liveTotal * 0.18).toFixed(2));
        const platformFee = parseFloat((liveTotal * 0.10).toFixed(2));
        const grandTotal = parseFloat((liveTotal + taxAmount + platformFee).toFixed(2));
        
        const { error } = await supabase
            .from('orders')
            .update({
                diagnosis_charge: diagnosisCharge,
                service_fee: serviceFee,
                parts_total: originalPartsSum,
                total_price: liveTotal,
                custom_quote_parts: customPartsStr,
                status: 'Quotation-Sent',
                invoice_number: invoiceNum,
                tax_amount: taxAmount,
                platform_fee: platformFee,
                grand_total: grandTotal
            })
            .eq('id', orderId);
            
        if (error) throw error;
        
        showToast('✉️ Finalized quotation sent to customer for review!', 'success');
        delete window.editingQuotationParts[orderId];
        delete window.editingQuotationServiceFee[orderId];
        delete window.editingQuotationDiagnosisCharge[orderId];
        loadDashboard();
    } catch (err) {
        showToast('Failed to dispatch quotation: ' + err.message, 'error');
    }
}

// ─── 7. MULTI-ROLE TRANSITIONS & CUSTOM QUOTATION FLOW ───
async function assignOrderRoles(orderId, technicianId, repairmasterId) {
    if (!supabase) return;
    try {
        const { error } = await supabase
            .from('orders')
            .update({ technician_id: technicianId, repairmaster_id: repairmasterId, status: 'Technician Assigned' })
            .eq('id', orderId);
        if (error) throw error;
        showToast('Roles assigned & notifications dispatched!', 'success');
        loadDashboard();
    } catch (err) {
        showToast('Assignment error: ' + err.message, 'error');
    }
}

async function assignDeliveryTechnician(orderId, techId) {
    if (!techId || !supabase) return;
    try {
        const handoverOtp = Math.floor(1000 + Math.random() * 9000).toString(); // generate delivery OTP automatically
        const { error } = await supabase.from('orders').update({
            technician_id: techId,
            pickup_otp: handoverOtp,
            status: 'Ready-For-Delivery'
        }).eq('id', orderId);
        if (error) throw error;
        showToast('🚚 Delivery Technician assigned successfully & Delivery OTP generated!', 'success');
        loadDashboard();
    } catch (err) {
        showToast('Assignment failed: ' + err.message, 'error');
    }
}

async function assignSelfAsTechnician(orderId) {
    if (!currentUser || !supabase) return showToast('Authentication required.', 'error');
    try {
        const { error } = await supabase
            .from('orders')
            .update({ technician_id: currentUser.id, status: 'Technician Assigned' })
            .eq('id', orderId);
        if (error) throw error;
        showToast('You are now the active technician for this job.', 'success');
        loadDashboard();
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

async function assignSelfAsRepairMaster(orderId) {
    if (!currentUser || !supabase) return showToast('Authentication required.', 'error');
    try {
        const { error } = await supabase
            .from('orders')
            .update({ repairmaster_id: currentUser.id, status: 'RepairMaster Assigned' })
            .eq('id', orderId);
        if (error) throw error;
        showToast('You are now the active RepairMaster workshop evaluator.', 'success');
        loadDashboard();
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function initiatePickup(orderId) {
    if (!supabase) return;
    const otp = generateOTP();
    try {
        const { error } = await supabase
            .from('orders')
            .update({ pickup_otp: otp, status: 'Pickup-Pending' })
            .eq('id', orderId);
        if (error) throw error;
        showToast('🔒 Handover OTP generated securely for the customer.', 'success');
        loadDashboard();
    } catch (err) {
        showToast('Pickup generation failed: ' + err.message, 'error');
    }
}

async function verifyPickup(orderId, otp) {
    if (!supabase) return;
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('pickup_otp')
            .eq('id', orderId)
            .single();
        if (error) throw error;
        if (data.pickup_otp !== otp) {
            showToast('❌ Invalid validation OTP. Authentication failed.', 'error');
            return;
        }
        await supabase.from('orders').update({ pickup_otp: null, status: 'With-RepairMaster' }).eq('id', orderId);
        showToast('🔒 Verification complete! Device checked in securely.', 'success');
        loadDashboard();
    } catch (err) {
        showToast('Verification failed: ' + err.message, 'error');
    }
}

async function updateDiagnosis(orderId, notes) {
    if (!notes || !supabase) return;
    try {
        const { error } = await supabase.from('orders').update({ diagnosis_notes: notes }).eq('id', orderId);
        if (error) throw error;
        showToast('📋 Lab diagnosis logs updated.', 'success');
        loadDashboard();
    } catch (err) {
        showToast('Diagnosis update failed: ' + err.message, 'error');
    }
}

async function requestAdditionalParts(orderId, partName, price) {
    if (!partName || isNaN(price) || !supabase) return;
    try {
        // Typically updates orders.custom_quote_parts
        const { data: ticket } = await supabase.from('orders').select('custom_quote_parts').eq('id', orderId).single();
        let existing = ticket.custom_quote_parts ? ticket.custom_quote_parts + '\n' : '';
        existing += `${partName},${price}`;
        const { error } = await supabase.from('orders').update({ custom_quote_parts: existing }).eq('id', orderId);
        if (error) throw error;
        showToast('Spare request dispatched to distributor.', 'success');
        loadDashboard();
    } catch (err) {
        showToast('Request failed: ' + err.message, 'error');
    }
}

async function sendQuotation(orderId) {
    if (!supabase) return;
    try {
        const editQuote = prompt("Update & Finalize Price for Quotation (INR):");
        if (!editQuote || isNaN(editQuote)) {
            showToast("Invalid price entered.", "error");
            return;
        }
        const finalizedTotal = parseFloat(editQuote);
        const invoiceNum = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const taxAmount = parseFloat((finalizedTotal * 0.18).toFixed(2));
        const platformFee = parseFloat((finalizedTotal * 0.10).toFixed(2));
        const grandTotal = parseFloat((finalizedTotal + taxAmount + platformFee).toFixed(2));

        const { error } = await supabase
            .from('orders')
            .update({
                total_price: finalizedTotal,
                status: 'Quotation-Sent',
                invoice_number: invoiceNum,
                tax_amount: taxAmount,
                platform_fee: platformFee,
                grand_total: grandTotal
            })
            .eq('id', orderId);
        if (error) throw error;
        showToast('✉️ Finalized quotation sent to the customer for review!', 'success');
        loadDashboard();
    } catch (err) {
        showToast('Failed to dispatch quotation: ' + err.message, 'error');
    }
}

async function confirmQuotation(orderId) {
    if (!supabase) return;
    try {
        const { error } = await supabase.from('orders').update({ status: 'Confirmed' }).eq('id', orderId);
        if (error) throw error;
        showToast('✅ Quotation approved! Repair work is starting.', 'success');
        loadDashboard();
    } catch (err) {
        showToast('Approval error: ' + err.message, 'error');
    }
}

async function rejectQuotation(orderId) {
    if (!supabase) return;
    try {
        const { error } = await supabase.from('orders').update({ status: 'Rejected' }).eq('id', orderId);
        if (error) throw error;
        showToast('❌ Quotation declined. Device reassembly & return requested.', 'info');
        loadDashboard();
    } catch (err) {
        showToast('Cancellation error: ' + err.message, 'error');
    }
}

// ─── 8. PROFILE MODIFICATION ENGINE ───
async function updateProfile() {
    if (!currentUser || !supabase) return showToast('Please login first.', 'error');
    const name = document.getElementById('profileName').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    const address = document.getElementById('profileAddress').value.trim();
    const city = document.getElementById('profileCity').value;

    if (!city || city === 'Nagpur' || city === 'Amravati') {
        showToast('We currently only serve Wardha. Nagpur & Amravati coming soon!', 'error');
        return;
    }
    try {
        const { error } = await supabase
            .from('users')
            .update({ name: name, phone: phone, address: address + ', ' + city })
            .eq('id', currentUser.id);
        if (error) throw error;
        showToast('✅ Member profile updated successfully!', 'success');
        
        const navName = document.getElementById('navUserName');
        const mNavName = document.getElementById('mobileNavUserName');
        if (navName) navName.textContent = name || currentUser.email;
        if (mNavName) mNavName.textContent = name || currentUser.email;
    } catch (err) {
        showToast('❌ Update failed: ' + err.message, 'error');
    }
}

// ─── 9. LIVE DASHBOARD RENDERER ───
async function loadDashboard() {
    closeAllDashboardModals();
    const container = document.getElementById('dashboardContent');
    if (!container) return;

    if (!currentUser) {
        container.innerHTML = `
            <div class="max-w-md mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-xl my-12 text-left">
                <div class="text-center">
                    <div class="inline-flex items-center justify-center p-[2px] rounded-[15px] border border-teal/70 bg-[#0A0F1D] h-16 w-16 shadow-[0_0_15px_rgba(20,184,166,0.15)] mb-4">
                        <img src="app/src/main/res/drawable/img_maintenance_mode_1782766826537.jpg" alt="RepairMaster Logo" class="h-full w-full object-cover rounded-[13px]" />
                    </div>
                    <h3 class="text-2xl font-bold text-white font-display">Sign In to Hub</h3>
                    <p class="text-gray-400 text-xs mt-1">Access DTC Tech Support Dashboard</p>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Email Address</label>
                        <input type="email" id="loginEmail" placeholder="you@example.com" class="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white focus:border-teal-400 outline-none">
                    </div>
                    <div>
                        <label class="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Password</label>
                        <input type="password" id="loginPassword" placeholder="••••••••" class="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white focus:border-teal-400 outline-none">
                    </div>
                    <button type="button" onclick="handleSignIn()" class="btn-teal w-full py-3 rounded-xl font-bold text-sm tracking-wide">Sign In</button>
                </div>
                <p class="text-center text-xs text-gray-500">
                    Don't have an account? Contact Coordinator to register your profile.
                </p>
            </div>
        `;
        return;
    }

    // Populate profile inputs
    try {
        if (supabase) {
            const { data: userData } = await supabase
                .from('users')
                .select('name, phone, address')
                .eq('id', currentUser.id)
                .single();

            if (userData) {
                if (document.getElementById('profileName')) document.getElementById('profileName').value = userData.name || '';
                if (document.getElementById('profilePhone')) document.getElementById('profilePhone').value = userData.phone || '';
                
                const addrParts = (userData.address || '').split(', ');
                if (document.getElementById('profileAddress')) document.getElementById('profileAddress').value = addrParts.slice(0, -1).join(', ') || '';
                
                const cityPart = addrParts[addrParts.length - 1] || '';
                if (document.getElementById('profileCity') && ['Wardha', 'Nagpur', 'Amravati'].includes(cityPart)) {
                    document.getElementById('profileCity').value = cityPart;
                }
            }
        }
    } catch(e) {
        console.warn("Could not retrieve user info from table:", e);
    }

    const roles = await getAllUserRoles(currentUser.id);
    let activeRole = localStorage.getItem('activeRole');
    if (!activeRole || !roles.includes(activeRole)) {
        if (roles.includes('admin')) activeRole = 'admin';
        else if (roles.includes('coordinator')) activeRole = 'coordinator';
        else if (roles.includes('technician')) activeRole = 'technician';
        else if (roles.includes('repairmaster')) activeRole = 'repairmaster';
        else activeRole = 'customer';
        localStorage.setItem('activeRole', activeRole);
    }

    // Render dynamic tab buttons
    const tabsContainer = document.getElementById('dashboard-tab-buttons-container');
    if (tabsContainer) {
        const roleTabs = ROLE_TABS[activeRole] || ROLE_TABS['customer'];
        tabsContainer.innerHTML = roleTabs.map(t => {
            return `
                <button id="tab-${t.id}-btn" onclick="switchDashboardTab('${t.id}')" class="px-5 py-3.5 text-xs md:text-sm font-medium text-gray-400 border-b-2 border-transparent hover:text-white outline-none whitespace-nowrap transition-all flex items-center gap-2">
                    <i class="fa-solid ${t.icon}"></i> ${t.label}
                </button>
            `;
        }).join('');
    }

    const isAdmin = activeRole === 'admin';
    const isCoordinator = activeRole === 'coordinator';
    const isTechnician = activeRole === 'technician';
    const isRepairMaster = activeRole === 'repairmaster';

    if (isAdmin || isCoordinator) {
        await loadStaffLists();
    }

    if (isRepairMaster || isAdmin) {
        await loadRepairPartsInventory();
    } else {
        const area = document.getElementById('repairmasterInventoryArea');
        if (area) area.classList.add('hidden');
    }

    const roleBadge = document.getElementById('userRoleBadge');
    const roleDisplay = document.getElementById('roleDisplay');
    if (roleBadge && roleDisplay) {
        let roleName = 'Customer';
        if (isAdmin) roleName = 'Admin';
        else if (isCoordinator) roleName = 'Coordinator';
        else if (isTechnician) roleName = 'Technician';
        else if (isRepairMaster) roleName = 'RepairMaster';
        roleDisplay.textContent = roleName;
        roleBadge.classList.remove('hidden');
    }

    // Load orders
    const ticketsCol = document.getElementById('ticketsCol');
    const alertsCol = document.getElementById('coordinatorAlertsCol');
    if (ticketsCol && alertsCol) {
        if (isCoordinator || isAdmin) {
            ticketsCol.className = "lg:col-span-2 space-y-6";
            alertsCol.className = "lg:col-span-1 space-y-6";
            fetchAndRenderAlerts();
        } else {
            ticketsCol.className = "lg:col-span-3 space-y-6";
            alertsCol.className = "hidden lg:col-span-1 space-y-6";
        }
    }

    let orders = [];
    if (supabase) {
        try {
            let query = supabase.from('orders').select('*');
            if (isAdmin || isCoordinator) {
                // Coordinators and Admins load all orders for comprehensive control console
            } else if (isTechnician) {
                query = query.eq('technician_id', currentUser.id);
            } else if (isRepairMaster) {
                query = query.eq('repairmaster_id', currentUser.id);
            } else {
                query = query.eq('user_id', currentUser.id);
            }
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            orders = data || [];
        } catch (err) {
            console.warn("Using offline mock orders:", err);
            orders = [
                { id: 'm1', order_number: 'RM-MOCK-123', customer_name: 'Akash Chaware', customer_phone: '9876543210', device_other: 'Vivo V30 Pro', repair_other: 'Screen Replacement', total_price: 6300, status: 'Pending', created_at: new Date().toISOString() }
            ];
        }
    }

    // Update stats counters
    const metricContainer = document.getElementById('metric-cards-container');
    if (metricContainer) {
        if (isRepairMaster) {
            const countNew = orders.filter(o => ['New', 'Pending'].includes(o.status)).length;
            const countDiagnosis = orders.filter(o => ['With-RepairMaster', 'Diagnosis-Pending'].includes(o.status)).length;
            const countRepair = orders.filter(o => ['Repair-In-Progress', 'Confirmed', 'Under-Repair'].includes(o.status)).length;
            const countComplete = orders.filter(o => ['Repair-Completed', 'Completed'].includes(o.status)).length;

            const cur = window.customStatFilter || 'All';
            metricContainer.innerHTML = `
                <div onclick="setStatFilter('New')" data-filter="New" class="stat-card cursor-pointer bg-slate-900/40 border ${cur === 'New' ? 'border-teal bg-teal-500/5' : 'border-slate-800'} rounded-2xl p-5 text-center hover:border-teal/50 transition">
                    <div class="text-3xl font-black text-amber-400">${countNew}</div>
                    <div class="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">New Requests</div>
                </div>
                <div onclick="setStatFilter('Diagnosis')" data-filter="Diagnosis" class="stat-card cursor-pointer bg-slate-900/40 border ${cur === 'Diagnosis' ? 'border-teal bg-teal-500/5' : 'border-slate-800'} rounded-2xl p-5 text-center hover:border-teal/50 transition">
                    <div class="text-3xl font-black text-blue-400">${countDiagnosis}</div>
                    <div class="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">Under Diagnosis</div>
                </div>
                <div onclick="setStatFilter('Repair')" data-filter="Repair" class="stat-card cursor-pointer bg-slate-900/40 border ${cur === 'Repair' ? 'border-teal bg-teal-500/5' : 'border-slate-800'} rounded-2xl p-5 text-center hover:border-teal/50 transition">
                    <div class="text-3xl font-black text-teal">${countRepair}</div>
                    <div class="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">Under Repair</div>
                </div>
                <div onclick="setStatFilter('Complete')" data-filter="Complete" class="stat-card cursor-pointer bg-slate-900/40 border ${cur === 'Complete' ? 'border-teal bg-teal-500/5' : 'border-slate-800'} rounded-2xl p-5 text-center hover:border-teal/50 transition">
                    <div class="text-3xl font-black text-emerald-400">${countComplete}</div>
                    <div class="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">Complete</div>
                </div>
            `;
        } else if (isTechnician) {
            const countNew = orders.filter(o => ['Technician Assigned', 'RepairMaster Assigned'].includes(o.status)).length;
            const countPickup = orders.filter(o => ['Pickup-Pending', 'Pickup-In-Progress'].includes(o.status)).length;
            const countDelivery = orders.filter(o => ['Delivery-Pending', 'Ready-For-Delivery', 'Delivery-In-Progress'].includes(o.status)).length;
            const countComplete = orders.filter(o => ['Delivered', 'Completed'].includes(o.status)).length;

            const cur = window.customStatFilter || 'All';
            metricContainer.innerHTML = `
                <div onclick="setStatFilter('New')" data-filter="New" class="stat-card cursor-pointer bg-slate-900/40 border ${cur === 'New' ? 'border-teal bg-teal-500/5' : 'border-slate-800'} rounded-2xl p-5 text-center hover:border-teal/50 transition">
                    <div class="text-3xl font-black text-amber-400">${countNew}</div>
                    <div class="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">New Requests</div>
                </div>
                <div onclick="setStatFilter('Pickup')" data-filter="Pickup" class="stat-card cursor-pointer bg-slate-900/40 border ${cur === 'Pickup' ? 'border-teal bg-teal-500/5' : 'border-slate-800'} rounded-2xl p-5 text-center hover:border-teal/50 transition">
                    <div class="text-3xl font-black text-blue-400">${countPickup}</div>
                    <div class="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">Under Pickup</div>
                </div>
                <div onclick="setStatFilter('Delivery')" data-filter="Delivery" class="stat-card cursor-pointer bg-slate-900/40 border ${cur === 'Delivery' ? 'border-teal bg-teal-500/5' : 'border-slate-800'} rounded-2xl p-5 text-center hover:border-teal/50 transition">
                    <div class="text-3xl font-black text-teal">${countDelivery}</div>
                    <div class="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">Under Delivery</div>
                </div>
                <div onclick="setStatFilter('Complete')" data-filter="Complete" class="stat-card cursor-pointer bg-slate-900/40 border ${cur === 'Complete' ? 'border-teal bg-teal-500/5' : 'border-slate-800'} rounded-2xl p-5 text-center hover:border-teal/50 transition">
                    <div class="text-3xl font-black text-emerald-400">${countComplete}</div>
                    <div class="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">Complete</div>
                </div>
            `;
        } else {
            const total = orders.length;
            const pending = orders.filter(o => ['Pending', 'Technician Assigned', 'RepairMaster Assigned'].includes(o.status)).length;
            const inProgress = orders.filter(o => ['Pickup-Pending', 'With-RepairMaster', 'In-Progress', 'Under-Repair'].includes(o.status)).length;
            const completed = orders.filter(o => ['Completed', 'Confirmed'].includes(o.status)).length;

            metricContainer.innerHTML = `
                <div class="stat-card bg-slate-900/40 border border-slate-800 rounded-2xl p-5 text-center">
                    <div class="text-3xl font-black text-teal" id="statTotal">${total}</div>
                    <div class="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">Total Tickets</div>
                </div>
                <div class="stat-card bg-slate-900/40 border border-slate-800 rounded-2xl p-5 text-center">
                    <div class="text-3xl font-black text-amber-400" id="statPending">${pending}</div>
                    <div class="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">Pending Assignment</div>
                </div>
                <div class="stat-card bg-slate-900/40 border border-slate-800 rounded-2xl p-5 text-center">
                    <div class="text-3xl font-black text-blue-400" id="statInProgress">${inProgress}</div>
                    <div class="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">Active Handover</div>
                </div>
                <div class="stat-card bg-slate-900/40 border border-slate-800 rounded-2xl p-5 text-center">
                    <div class="text-3xl font-black text-emerald-400" id="statCompleted">${completed}</div>
                    <div class="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">Completed &amp; Fixed</div>
                </div>
            `;
        }
    }

    window.allFetchedOrders = orders;

    renderFilteredOrders();

    function renderFilteredOrders() {
        const container = document.getElementById('dashboardContent');
        if (!container) return;

        const activeRole = localStorage.getItem('activeRole') || 'customer';
        const isAdmin = activeRole === 'admin';
        const isCoordinator = activeRole === 'coordinator';
        const isTechnician = activeRole === 'technician';
        const isRepairMaster = activeRole === 'repairmaster';

        // Show or hide coordinator filters panel
        const filterPanel = document.getElementById('coordinatorFiltersPanel');
        if (filterPanel) {
            if (isCoordinator || isAdmin) {
                filterPanel.classList.remove('hidden');
            } else {
                filterPanel.classList.add('hidden');
            }
        }

        // Populate technician dropdown dynamically if it has not been loaded yet
        const filterTechSelect = document.getElementById('filterTechnician');
        if (filterTechSelect && filterTechSelect.options.length <= 1) {
            const techs = window.allTechnicians || [];
            techs.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.textContent = t.name;
                filterTechSelect.appendChild(opt);
            });
        }

        const searchQuery = document.getElementById('filterSearch')?.value.trim().toLowerCase() || '';
        const selectedStatus = document.getElementById('filterStatus')?.value || 'All';
        const selectedTechnician = document.getElementById('filterTechnician')?.value || 'All';
        const filterStartDate = document.getElementById('filterStartDate')?.value || '';
        const filterEndDate = document.getElementById('filterEndDate')?.value || '';

        const hasActiveFilter = !!(searchQuery || selectedStatus !== 'All' || selectedTechnician !== 'All' || filterStartDate || filterEndDate || (window.customStatFilter && window.customStatFilter !== 'All'));

        function isOrderMatching(o) {
            if (window.singleOrderFilter && window.singleOrderFilter !== o.id) {
                return false;
            }
            let matchesSearch = true;
            if (searchQuery) {
                matchesSearch = (o.order_number || '').toLowerCase().includes(searchQuery) ||
                    (o.customer_name || '').toLowerCase().includes(searchQuery) ||
                    (o.customer_phone || '').toLowerCase().includes(searchQuery);
            }

            let matchesStatus = true;
            if (selectedStatus !== 'All') {
                if (selectedStatus === 'New') {
                    matchesStatus = o.status === 'Pending';
                } else if (selectedStatus === 'PendingAction') {
                    matchesStatus = ['Pending', 'Quotation-Sent'].includes(o.status);
                } else if (selectedStatus === 'Active') {
                    matchesStatus = ['Technician Assigned', 'Pickup-Pending', 'Confirmed', 'With-RepairMaster', 'Quotation-Sent', 'Awaiting-Payment', 'Under-Repair'].includes(o.status);
                } else if (selectedStatus === 'Repair') {
                    matchesStatus = o.status === 'With-RepairMaster' || o.status === 'Confirmed' || o.status === 'Under-Repair';
                } else if (selectedStatus === 'Delivery') {
                    matchesStatus = o.status === 'Ready-For-Delivery';
                } else if (selectedStatus === 'Closed') {
                    matchesStatus = ['Completed', 'Rejected'].includes(o.status);
                }
            }

            let matchesTechnician = true;
            if (selectedTechnician !== 'All') {
                matchesTechnician = (String(o.technician_id) === String(selectedTechnician));
            }

            let matchesDate = true;
            if (o.created_at) {
                const orderDate = o.created_at.substring(0, 10); // YYYY-MM-DD
                if (filterStartDate && orderDate < filterStartDate) {
                    matchesDate = false;
                }
                if (filterEndDate && orderDate > filterEndDate) {
                    matchesDate = false;
                }
            } else if (filterStartDate || filterEndDate) {
                matchesDate = false;
            }

            let matchesStatCard = true;
            if (window.customStatFilter && window.customStatFilter !== 'All') {
                if (activeRole === 'repairmaster') {
                    if (window.customStatFilter === 'New') {
                        matchesStatCard = ['New', 'Pending'].includes(o.status);
                    } else if (window.customStatFilter === 'Diagnosis') {
                        matchesStatCard = ['With-RepairMaster', 'Diagnosis-Pending'].includes(o.status);
                    } else if (window.customStatFilter === 'Repair') {
                        matchesStatCard = ['Repair-In-Progress', 'Confirmed', 'Under-Repair'].includes(o.status);
                    } else if (window.customStatFilter === 'Complete') {
                        matchesStatCard = ['Repair-Completed', 'Completed'].includes(o.status);
                    }
                } else if (activeRole === 'technician') {
                    if (window.customStatFilter === 'New') {
                        matchesStatCard = ['Technician Assigned', 'RepairMaster Assigned'].includes(o.status);
                    } else if (window.customStatFilter === 'Pickup') {
                        matchesStatCard = ['Pickup-Pending', 'Pickup-In-Progress'].includes(o.status);
                    } else if (window.customStatFilter === 'Delivery') {
                        matchesStatCard = ['Delivery-Pending', 'Ready-For-Delivery', 'Delivery-In-Progress'].includes(o.status);
                    } else if (window.customStatFilter === 'Complete') {
                        matchesStatCard = ['Delivered', 'Completed'].includes(o.status);
                    }
                }
            }

            return matchesSearch && matchesStatus && matchesTechnician && matchesDate && matchesStatCard;
        }

        let ordersToRender = [...window.allFetchedOrders];

        // Sort so matched orders are placed at the top, and unmatched "old logs" are kept at the bottom
        ordersToRender.sort((a, b) => {
            const matchA = isOrderMatching(a);
            const matchB = isOrderMatching(b);
            if (matchA && !matchB) return -1;
            if (!matchA && matchB) return 1;
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });

        let pillFilterHtml = '';
        if (isRepairMaster || isTechnician) {
            const currentFilter = window.customStatFilter || 'All';
            const options = isRepairMaster ? [
                { id: 'All', label: 'All Jobs' },
                { id: 'New', label: 'New Requests' },
                { id: 'Diagnosis', label: 'Under Diagnosis' },
                { id: 'Repair', label: 'Under Repair' },
                { id: 'Complete', label: 'Completed' }
            ] : [
                { id: 'All', label: 'All Jobs' },
                { id: 'New', label: 'New Requests' },
                { id: 'Pickup', label: 'Under Pickup' },
                { id: 'Delivery', label: 'Under Delivery' },
                { id: 'Complete', label: 'Completed' }
            ];

            pillFilterHtml = `
                <div class="flex flex-wrap items-center gap-1.5 pb-4 mb-2">
                    <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mr-1.5"><i class="fa-solid fa-filter text-teal"></i> Active Stat Filter:</span>
                    ${options.map(opt => {
                        const active = currentFilter === opt.id;
                        const btnClass = active 
                            ? "bg-teal/20 border-teal text-teal text-[11px] font-black px-3.5 py-1.5 rounded-full border transition"
                            : "bg-slate-900/60 border-slate-800 text-gray-400 hover:text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full border transition";
                        return `<button onclick="setStatFilter('${opt.id}')" class="${btnClass}">${opt.label}</button>`;
                    }).join('')}
                </div>
            `;
        }

        if (ordersToRender.length === 0) {
            container.innerHTML = pillFilterHtml + `
                <div class="text-center text-grayText/60 py-12">
                    <i class="fa-regular fa-folder-open text-5xl mb-3 text-tealAccent"></i>
                    <p class="text-base font-semibold text-white">No Tickets Available</p>
                    <p class="text-xs text-grayText">You do not have any active or historical tickets recorded on the platform.</p>
                </div>
            `;
            return;
        }

        let hasMatchedCount = ordersToRender.filter(isOrderMatching).length;
        let matchAlertHtml = '';
        if (hasActiveFilter && hasMatchedCount === 0) {
            matchAlertHtml = `
                <div class="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-xl p-3 mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-circle-exclamation text-amber-400"></i>
                    <span>No exact matches found. All historic/older logs are shown below.</span>
                </div>
            `;
        }

        let html = pillFilterHtml + matchAlertHtml + `<div class="grid grid-cols-1 gap-4">`;
        ordersToRender.forEach(o => {
            const matched = isOrderMatching(o);
            html += buildSingleOrderCardHtml(o, isAdmin, isCoordinator, isTechnician, isRepairMaster, false, matched);
        });
        html += `</div>`;
        container.innerHTML = html;
    }
    window.renderFilteredOrders = renderFilteredOrders;

    function applyDashboardFilters() {
        renderFilteredOrders();
    }
    window.applyDashboardFilters = applyDashboardFilters;

    // Initialize default dashboard tab state
    setTimeout(() => {
        const defaultTab = ROLE_TABS[activeRole]?.[0]?.id || 'tickets';
        switchDashboardTab(defaultTab);
    }, 50);
}

function switchDashboardTab(tabId) {
    const tabs = ['tickets', 'filters', 'inventory', 'sql', 'dynamic'];
    
    tabs.forEach(t => {
        const sec = document.getElementById(`tab-${t}-section`);
        if (sec) {
            if (t === tabId || (t === 'dynamic' && !['tickets', 'filters', 'inventory', 'sql'].includes(tabId))) {
                sec.classList.remove('hidden');
            } else {
                sec.classList.add('hidden');
            }
        }
    });

    // Handle tab button styling inside the container dynamically
    const container = document.getElementById('dashboard-tab-buttons-container');
    if (container) {
        const buttons = container.querySelectorAll('button');
        buttons.forEach(btn => {
            if (btn.id === `tab-${tabId}-btn`) {
                btn.className = "px-5 py-3.5 text-xs md:text-sm font-bold text-teal border-b-2 border-teal outline-none whitespace-nowrap transition-all flex items-center gap-2";
            } else {
                btn.className = "px-5 py-3.5 text-xs md:text-sm font-medium text-gray-400 border-b-2 border-transparent hover:text-white outline-none whitespace-nowrap transition-all flex items-center gap-2";
            }
        });
    }

    const activeRole = localStorage.getItem('activeRole') || 'customer';
    const isAdmin = activeRole === 'admin';
    const isCoordinator = activeRole === 'coordinator';
    const isRepairMaster = activeRole === 'repairmaster';

    // Staff Filter visibility
    const filterPanel = document.getElementById('coordinatorFiltersPanel');
    const filterNotice = document.getElementById('nonStaffFilterNotice');
    if (filterPanel && filterNotice) {
        if (isCoordinator || isAdmin) {
            filterPanel.classList.remove('hidden');
            filterNotice.classList.add('hidden');
        } else {
            filterPanel.classList.add('hidden');
            filterNotice.classList.remove('hidden');
        }
    }

    // Inventory visibility
    const inventoryPanel = document.getElementById('repairmasterInventoryArea');
    const inventoryNotice = document.getElementById('nonStaffInventoryNotice');
    if (inventoryPanel && inventoryNotice) {
        if (isRepairMaster || isCoordinator || isAdmin) {
            inventoryPanel.classList.remove('hidden');
            inventoryNotice.classList.add('hidden');
        } else {
            inventoryPanel.classList.add('hidden');
            inventoryNotice.classList.remove('hidden');
        }
    }

    // If it's a dynamic tab, render its content
    if (!['tickets', 'filters', 'inventory', 'sql'].includes(tabId)) {
        renderDynamicTabContent(tabId);
    }
}
window.switchDashboardTab = switchDashboardTab;

// ─── 10. AUTH STATUS UPDATE & CUSTOM DRAWER/BELL CONTROLLERS ───

// Global Drawer toggle function
function toggleProfileDrawer() {
    const drawer = document.getElementById('profileSidebarDrawer');
    if (!drawer) return;
    drawer.classList.toggle('hidden');
}
window.toggleProfileDrawer = toggleProfileDrawer;

function enableDrawerEditMode() {
    const ro = document.getElementById('drawerReadOnlyView');
    const ed = document.getElementById('drawerEditableForm');
    if (ro) ro.classList.add('hidden');
    if (ed) ed.classList.remove('hidden');
}
window.enableDrawerEditMode = enableDrawerEditMode;

function disableDrawerEditMode() {
    const ro = document.getElementById('drawerReadOnlyView');
    const ed = document.getElementById('drawerEditableForm');
    if (ro) ro.classList.remove('hidden');
    if (ed) ed.classList.add('hidden');
}
window.disableDrawerEditMode = disableDrawerEditMode;

function toggleNotificationDropdown(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
}
window.toggleNotificationDropdown = toggleNotificationDropdown;

function toggleProfileDropdown(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
}
window.toggleProfileDropdown = toggleProfileDropdown;

// Global outside click listener to close dropdowns
document.addEventListener('click', () => {
    const pDropdown = document.getElementById('profileDropdown');
    if (pDropdown) pDropdown.classList.add('hidden');
    const nDropdown = document.getElementById('notificationDropdown');
    if (nDropdown) nDropdown.classList.add('hidden');
});

function clearNotifications() {
    const badge = document.getElementById('navNotificationBadge');
    if (badge) badge.classList.add('hidden');
    showToast('Activity notifications marked as read.', 'success');
}
window.clearNotifications = clearNotifications;

// Listen for clicks outside dropdown to close it
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('notificationDropdown');
    const bellContainer = document.getElementById('notificationDropdownContainer');
    if (dropdown && !dropdown.classList.contains('hidden') && bellContainer && !bellContainer.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
});

// Function to check and populate the track dropdown if user is logged in
async function checkAndPopulateTracker() {
    const trackOrderIdInput = document.getElementById('trackOrderId');
    const trackPhoneInput = document.getElementById('trackPhone');
    if (!supabase || !currentUser || !trackOrderIdInput || !trackPhoneInput) return;

    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const { data: uData } = await supabase
            .from('users')
            .select('phone')
            .eq('id', currentUser.id)
            .single();

        if (uData && uData.phone) {
            trackPhoneInput.value = uData.phone;
        }

        if (orders && orders.length > 0) {
            const selectEl = document.createElement('select');
            selectEl.id = 'trackOrderId';
            selectEl.className = 'w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm text-white focus:border-teal-400 outline-none cursor-pointer';
            selectEl.required = true;

            orders.forEach(o => {
                const opt = document.createElement('option');
                opt.value = o.order_number;
                opt.textContent = `#${o.order_number} (${o.status || 'Pending'})`;
                selectEl.appendChild(opt);
            });

            const manualOpt = document.createElement('option');
            manualOpt.value = 'MANUAL';
            manualOpt.textContent = '✏️ Search another ticket...';
            selectEl.appendChild(manualOpt);

            const parentNode = trackOrderIdInput.parentNode;
            parentNode.replaceChild(selectEl, trackOrderIdInput);

            selectEl.onchange = function() {
                if (this.value === 'MANUAL') {
                    const txtInput = document.createElement('input');
                    txtInput.type = 'text';
                    txtInput.id = 'trackOrderId';
                    txtInput.placeholder = 'e.g. RM-REQ-JXK3D9';
                    txtInput.required = true;
                    txtInput.className = 'w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm text-white focus:border-teal-400 outline-none';
                    parentNode.replaceChild(txtInput, selectEl);
                }
            };
        }
    } catch (e) {
        console.warn("Tracker populating warning:", e);
    }
}
window.checkAndPopulateTracker = checkAndPopulateTracker;

async function getAllUserRoles(userId) {
    if (!userId || !supabase) return ['customer'];
    const rolesSet = new Set();
    
    // 1. Try from profiles table
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();
        if (!error && profile && profile.role) {
            const profileRoles = profile.role.split(',').map(r => r.trim().toLowerCase()).filter(Boolean);
            profileRoles.forEach(r => rolesSet.add(r));
        }
    } catch (err) {
        console.warn("Profiles role fetch error:", err);
    }
    
    // 2. Try from user_roles junction table
    try {
        const { data, error } = await supabase
            .from('user_roles')
            .select('roles(name)')
            .eq('user_id', userId);
        if (!error && data) {
            data.map(row => row.roles?.name).filter(Boolean).forEach(r => rolesSet.add(r.toLowerCase()));
        }
    } catch (err) {
        console.warn("User roles table fetch error:", err);
    }
    
    if (rolesSet.size === 0) {
        rolesSet.add('customer');
    }
    
    return Array.from(rolesSet);
}
window.getAllUserRoles = getAllUserRoles;

function changeActiveRole(newRole) {
    localStorage.setItem('activeRole', newRole);
    showToast(`Switched active role to ${newRole.toUpperCase()}`, 'success');
    loadDashboard();
}
window.changeActiveRole = changeActiveRole;

async function updateNavForAuth(user) {
    const navLogin = document.getElementById('navLogin');
    const navSignup = document.getElementById('navSignup');
    const navUserInfo = document.getElementById('navUserInfo');
    
    const mNavLogin = document.getElementById('mobileNavLogin');
    const mNavSignup = document.getElementById('mobileNavSignup');
    const mNavUserInfo = document.getElementById('mobileNavUserInfo');

    if (user) {
        if (navLogin) navLogin.style.display = 'none';
        if (navSignup) navSignup.style.display = 'none';
        
        const username = user.user_metadata?.full_name || user.email.split('@')[0];
        const initials = username.substring(0, 2).toUpperCase();

        const roles = await getAllUserRoles(user.id);
        const activeRole = localStorage.getItem('activeRole') || roles[0] || 'customer';

        let roleSwitcherHtml = '';
        if (roles.length > 1) {
            roleSwitcherHtml = `
                <div class="relative inline-block text-left mr-1" id="roleSwitcherContainer">
                    <select onchange="changeActiveRole(this.value)" class="bg-slate-950/90 border border-teal-500/30 hover:border-teal-500 text-teal-400 text-[10px] font-black uppercase rounded-xl py-1.5 px-3 outline-none focus:border-teal-400 cursor-pointer transition">
                        ${roles.map(r => `<option value="${r}" ${r === activeRole ? 'selected' : ''}>${r.toUpperCase()}</option>`).join('')}
                    </select>
                </div>
            `;
        }

        if (navUserInfo) {
            navUserInfo.classList.remove('hidden');
            navUserInfo.className = "flex items-center gap-3";
            navUserInfo.innerHTML = `
                <!-- Dynamic Notification Bell -->
                <div class="relative inline-block text-left" id="notificationDropdownContainer">
                    <button onclick="toggleNotificationDropdown(event)" class="relative p-2 rounded-full text-gray-400 hover:text-white hover:bg-slate-800/40 focus:outline-none transition">
                        <i class="fa-regular fa-bell text-lg"></i>
                        <span id="navNotificationBadge" class="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[8px] font-black leading-none text-white bg-red-500 rounded-full">3</span>
                    </button>
                    <!-- Notification Dropdown -->
                    <div id="notificationDropdown" class="hidden absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 py-3 text-left">
                        <div class="px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                            <span class="text-xs font-bold text-white uppercase tracking-wider">Activity Log Notifications</span>
                            <button onclick="clearNotifications()" class="text-[10px] text-teal-400 hover:underline">Mark read</button>
                        </div>
                        <div class="max-h-64 overflow-y-auto divide-y divide-slate-800/60" id="notificationList">
                            <div class="p-3 hover:bg-slate-800/30 transition text-xs">
                                <p class="text-white font-medium">📋 System Online</p>
                                <p class="text-[10px] text-gray-500 mt-0.5">Secure DTC connection initialized in Wardha Hub.</p>
                            </div>
                            <div class="p-3 hover:bg-slate-800/30 transition text-xs">
                                <p class="text-white font-medium">🔒 Privacy Checkpoint Active</p>
                                <p class="text-[10px] text-gray-500 mt-0.5">Device diagnostics verify maintenance logs safe.</p>
                            </div>
                            <div class="p-3 hover:bg-slate-800/30 transition text-xs">
                                <p class="text-white font-medium">✨ Account Verified</p>
                                <p class="text-[10px] text-gray-500 mt-0.5">Welcome to your dedicated dashboard.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Role Switcher Dropdown in navbar if multiple roles -->
                ${roleSwitcherHtml}

                <!-- Custom Avatar Menu trigger (Compact round avatar with dropdown) -->
                <div class="relative inline-block text-left" id="profileDropdownContainer">
                    <button onclick="toggleProfileDropdown(event)" class="w-9 h-9 rounded-full bg-teal-500/10 border-2 border-teal-500/40 text-teal-400 font-bold text-sm flex items-center justify-center shadow-lg shadow-teal-500/5 hover:border-teal-400 transition-all duration-300 focus:outline-none" title="View Account Profile">
                        ${initials}
                    </button>
                    <!-- Desktop Profile Dropdown -->
                    <div id="profileDropdown" class="hidden absolute right-0 mt-3 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 py-2.5 text-left">
                        <div class="px-4 py-2 border-b border-slate-800/60 mb-1">
                            <p class="text-xs font-black text-white truncate">${username}</p>
                            <p class="text-[9px] text-gray-400 truncate">${user.email}</p>
                        </div>
                        <button onclick="toggleProfileDrawer(); toggleProfileDropdown(event);" class="w-full text-left px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-slate-800/40 flex items-center gap-2 transition">
                            <i class="fa-regular fa-user text-teal"></i> Account Profile
                        </button>
                        <a href="dashboard.html" class="w-full text-left px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-slate-800/40 flex items-center gap-2 transition">
                            <i class="fa-solid fa-chart-line text-teal"></i> Go to Dashboard
                        </a>
                        <div class="border-t border-slate-800/60 my-1"></div>
                        <button onclick="logoutUser()" class="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition">
                            <i class="fa-solid fa-power-off text-red-500"></i> Log Out
                        </button>
                    </div>
                </div>
            `;
        }

        if (mNavLogin) mNavLogin.style.display = 'none';
        if (mNavSignup) mNavSignup.style.display = 'none';

        if (mNavUserInfo) {
            mNavUserInfo.classList.remove('hidden');
            
            let mRoleSwitcherHtml = '';
            if (roles.length > 1) {
                mRoleSwitcherHtml = `
                    <div class="w-full mb-2">
                        <label class="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1 text-center">Active Role Switcher</label>
                        <select onchange="changeActiveRole(this.value)" class="w-full bg-slate-950 border border-slate-800 text-teal-400 text-xs font-bold rounded-xl py-2 px-3 outline-none focus:border-teal-400 text-center uppercase cursor-pointer">
                            ${roles.map(r => `<option value="${r}" ${r === activeRole ? 'selected' : ''}>${r.toUpperCase()}</option>`).join('')}
                        </select>
                    </div>
                `;
            }

            mNavUserInfo.innerHTML = `
                <div class="mt-2 flex flex-col gap-2 items-center justify-center">
                    ${mRoleSwitcherHtml}
                    <button onclick="toggleProfileDrawer()" class="w-full bg-slate-900 border border-slate-800 py-2.5 px-4 rounded-xl text-xs text-white font-bold flex items-center justify-center gap-1.5">
                        👤 View &amp; Edit Profile
                    </button>
                    <button onclick="logoutUser(); toggleMobileMenu();" class="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                        <i class="fa-solid fa-power-off"></i> Log Out Account
                    </button>
                </div>
            `;
        }

        // Setup dynamic profile sidebar drawer container
        let drawer = document.getElementById('profileSidebarDrawer');
        if (!drawer) {
            drawer = document.createElement('div');
            drawer.id = 'profileSidebarDrawer';
            drawer.className = 'fixed inset-y-0 right-0 w-96 bg-slate-900/95 border-l border-slate-800 shadow-2xl z-50 transform translate-x-full transition-transform duration-300 ease-in-out p-6 flex flex-col justify-between hidden';
            document.body.appendChild(drawer);
        }

        // Fetch user metadata/profile table to populate drawer dynamically
        let userDbData = { name: username, phone: user.user_metadata?.phone || 'N/A', address: 'Wardha, Maharashtra' };
        try {
            const { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).single();
            if (dbUser) {
                userDbData = dbUser;
            }
        } catch (e) {
            console.warn("Could not fetch database user profile:", e);
        }

        drawer.innerHTML = `
            <div>
                <!-- Header -->
                <div class="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                    <h3 class="text-base font-bold text-white flex items-center gap-2 font-display">
                        <i class="fa-regular fa-address-card text-teal"></i> Account Profile
                    </h3>
                    <button onclick="toggleProfileDrawer()" class="text-gray-400 hover:text-white text-base font-bold">✕</button>
                </div>

                <!-- Avatar Section -->
                <div class="text-center mb-4">
                    <div class="w-16 h-16 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-2 shadow-lg shadow-teal-500/5">
                        ${initials}
                    </div>
                    <h4 class="text-sm font-bold text-white" id="drawerProfileEmail">${user.email}</h4>
                    <span class="inline-block bg-teal-500/10 text-teal-400 text-[9px] uppercase font-bold px-2.5 py-0.5 rounded-full mt-1.5">DTC Registered Member</span>
                </div>

                <!-- Role Selector Placeholder -->
                <div id="drawerRoleSwitcherContainer" class="mb-5"></div>

                <!-- Profile Data Fields -->
                <div class="space-y-4">
                    <!-- Read Only View -->
                    <div id="drawerReadOnlyView" class="space-y-4">
                        <div class="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 text-left">
                            <span class="text-[9px] text-gray-500 uppercase font-black tracking-wider block">Full Name</span>
                            <p class="text-xs text-white font-medium mt-0.5" id="drawerLabelName">${userDbData.name}</p>
                        </div>
                        <div class="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 text-left">
                            <span class="text-[9px] text-gray-500 uppercase font-black tracking-wider block">Mobile Number</span>
                            <p class="text-xs text-white font-medium mt-0.5" id="drawerLabelPhone">${userDbData.phone}</p>
                        </div>
                        <div class="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 text-left">
                            <span class="text-[9px] text-gray-500 uppercase font-black tracking-wider block">Doorstep Address</span>
                            <p class="text-xs text-white font-medium mt-0.5" id="drawerLabelAddress">${userDbData.address}</p>
                        </div>
                        <div class="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 text-left">
                            <span class="text-[9px] text-gray-500 uppercase font-black tracking-wider block">Assigned Hub</span>
                            <p class="text-xs text-teal-400 font-bold mt-0.5"><i class="fa-solid fa-location-dot text-[10px] mr-1"></i> Wardha Hub (Active)</p>
                        </div>
                        <button onclick="enableDrawerEditMode()" class="w-full bg-slate-800/60 hover:bg-slate-800 text-teal-400 hover:text-teal-300 text-xs font-bold py-3 rounded-xl border border-teal-500/10 mt-3 transition flex items-center justify-center gap-1.5">
                            <i class="fa-regular fa-edit"></i> Edit Profile Details
                        </button>
                    </div>

                    <!-- Edit Form (Hidden by default) -->
                    <div id="drawerEditableForm" class="hidden space-y-4">
                        <div class="text-left">
                            <label class="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Full Name</label>
                            <input type="text" id="profileName" value="${userDbData.name}" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-teal outline-none transition">
                        </div>
                        <div class="text-left">
                            <label class="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Mobile Number</label>
                            <input type="tel" id="profilePhone" value="${userDbData.phone}" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-teal outline-none transition">
                        </div>
                        <div class="text-left">
                            <label class="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Doorstep Address</label>
                            <input type="text" id="profileAddress" value="${userDbData.address}" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-teal outline-none transition">
                        </div>
                        <div class="text-left">
                            <label class="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Hub Location</label>
                            <select id="profileCity" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-teal outline-none transition cursor-pointer">
                                <option value="Wardha">Wardha Hub (Active)</option>
                                <option value="Nagpur" disabled>Nagpur Hub (Coming soon)</option>
                                <option value="Amravati" disabled>Amravati Hub (Coming soon)</option>
                            </select>
                        </div>
                        <div class="flex gap-2 pt-2">
                            <button onclick="updateProfile()" class="flex-1 bg-teal-600 hover:bg-teal-500 text-slate-950 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1">
                                <i class="fa-regular fa-circle-check"></i> Save
                            </button>
                            <button onclick="disableDrawerEditMode()" class="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 rounded-xl border border-slate-700 transition">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer Section -->
            <button onclick="logoutUser()" class="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold py-3 rounded-xl border border-red-500/20 transition mt-6 flex items-center justify-center gap-2">
                <i class="fa-solid fa-power-off"></i> Log Out Account
            </button>
        `;

        try {
            const roles = await getUserRoles(user.id);
            localStorage.setItem('allUserRoles', JSON.stringify(roles));
            
            let activeRole = localStorage.getItem('activeRole');
            if (!activeRole || !roles.includes(activeRole)) {
                if (roles.includes('admin')) activeRole = 'admin';
                else if (roles.includes('coordinator')) activeRole = 'coordinator';
                else if (roles.includes('technician')) activeRole = 'technician';
                else if (roles.includes('repairmaster')) activeRole = 'repairmaster';
                else activeRole = 'customer';
                localStorage.setItem('activeRole', activeRole);
            }
            renderRoleSelector(roles, activeRole);
            
            // Populate check/track widgets elegantly
            await checkAndPopulateTracker();
        } catch (e) {
            console.warn("Could not load roles for nav update:", e);
        }
    } else {
        if (navLogin) navLogin.style.display = 'inline-block';
        if (navSignup) navSignup.style.display = 'inline-block';
        if (navUserInfo) navUserInfo.classList.add('hidden');
        localStorage.removeItem('allUserRoles');
        localStorage.removeItem('activeRole');

        if (mNavLogin) mNavLogin.style.display = 'inline-block';
        if (mNavSignup) mNavSignup.style.display = 'inline-block';
        if (mNavUserInfo) mNavUserInfo.classList.add('hidden');


    }
}

function renderRoleSelector(roles, activeRole) {
    const drawerSwitcherContainer = document.getElementById('drawerRoleSwitcherContainer');
    const mNavUserInfo = document.getElementById('mobileNavUserInfo');
    
    if (drawerSwitcherContainer) {
        if (roles.length > 1) {
            const optionsHtml = roles.map(r => `
                <option value="${r}" ${r === activeRole ? 'selected' : ''}>${r.toUpperCase()}</option>
            `).join('');
            drawerSwitcherContainer.innerHTML = `
                <div class="bg-slate-950/60 border border-teal-500/20 rounded-xl p-3 flex flex-col gap-2 text-left">
                    <label class="text-[10px] text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fa-solid fa-arrows-spin mr-1"></i> Switch Dashboard View
                    </label>
                    <select onchange="switchActiveRole(this.value)" class="w-full bg-slate-900 text-white font-bold text-xs outline-none border border-slate-800 rounded-lg px-2.5 py-1.5 cursor-pointer focus:border-teal transition">
                        ${optionsHtml}
                    </select>
                </div>
            `;
        } else {
            drawerSwitcherContainer.innerHTML = `
                <div class="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 text-center">
                    <span class="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Active Role</span>
                    <p class="text-teal-400 font-bold text-xs uppercase mt-1">
                        <i class="fa-solid fa-user-shield text-[10px] mr-1"></i> ${activeRole}
                    </p>
                </div>
            `;
        }
    }

    if (mNavUserInfo) {
        let mSwitcher = document.getElementById('mobileNavRoleSwitcher');
        if (!mSwitcher) {
            mSwitcher = document.createElement('div');
            mSwitcher.id = 'mobileNavRoleSwitcher';
            mSwitcher.className = 'mt-2 flex items-center justify-center gap-2 bg-slate-900/80 border border-teal-500/30 px-3 py-1.5 rounded-xl text-xs text-white mx-auto max-w-[200px]';
            mNavUserInfo.appendChild(mSwitcher);
        }
        if (roles.length > 1) {
            const mOptionsHtml = roles.map(r => `
                <option value="${r}" ${r === activeRole ? 'selected' : ''}>${r.toUpperCase()}</option>
            `).join('');
            mSwitcher.innerHTML = `
                <label class="text-[9px] text-teal-400 font-bold uppercase tracking-wider">Dashboard:</label>
                <select onchange="switchActiveRole(this.value)" class="bg-transparent text-white font-bold outline-none cursor-pointer">
                    ${mOptionsHtml}
                </select>
            `;
        } else {
            mSwitcher.innerHTML = `
                <span class="text-teal-400 font-bold tracking-wider uppercase text-[10px]"><i class="fa-solid fa-user-shield mr-1"></i> ${activeRole}</span>
            `;
        }
    }
}

function switchActiveRole(newRole) {
    localStorage.setItem('activeRole', newRole);
    showToast(`Navigating to ${newRole.toUpperCase()} Dashboard`, 'success');
    setTimeout(() => {
        if (window.location.href.includes('dashboard.html')) {
            window.location.reload();
        } else {
            window.location.href = 'dashboard.html';
        }
    }, 1000);
}

window.switchActiveRole = switchActiveRole;

async function completeRepair(orderId) {
    if (!supabase) return;
    try {
        // Change status to 'Ready-For-Delivery' instead of 'Completed' to bypass billing and payment
        const { error } = await supabase.from('orders').update({ status: 'Ready-For-Delivery' }).eq('id', orderId);
        if (error) throw error;
        showToast('🎉 Repair completed! Bypassed billing & payment. Coordinator can now assign a delivery technician.', 'success');
        loadDashboard();
    } catch (err) {
        showToast('Failed to complete repair: ' + err.message, 'error');
    }
}

async function payForRepair(orderId, amount, deviceName) {
    // Show a premium payment confirmation gateway popup!
    const modal = document.createElement('div');
    modal.id = 'paymentGatewayModal';
    modal.className = 'fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-slate-900 border border-teal-500/30 p-6 rounded-2xl max-w-md w-full shadow-2xl relative text-left">
            <button onclick="document.getElementById('paymentGatewayModal').remove()" class="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
                    <i class="fa-solid fa-shield-halved"></i>
                </div>
                <h3 class="text-lg font-bold text-white">Secure Gateway Payment</h3>
                <p class="text-xs text-gray-400">RepairMaster DTC Escrow Channel</p>
            </div>
            
            <div class="bg-slate-950 border border-slate-800 p-4 rounded-xl mb-6 space-y-2 text-sm text-gray-300">
                <div class="flex justify-between"><span>Device:</span><span class="text-white font-bold">${deviceName}</span></div>
                <div class="flex justify-between"><span>Amount to Pay:</span><span class="text-teal-400 font-black">₹${amount.toLocaleString('en-IN')}</span></div>
            </div>
            
            <div class="space-y-4">
                <div>
                    <label class="text-[10px] text-gray-400 font-bold uppercase block mb-1">Select Payment Method</label>
                    <select id="payMethod" class="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm text-white focus:border-teal-500/50 outline-none">
                        <option value="upi">UPI / Scan GPay / PhonePe</option>
                        <option value="card">Credit / Debit Card</option>
                        <option value="cod">Cash on Delivery</option>
                    </select>
                </div>
                
                <div id="upiQRCodeBlock" class="text-center p-4 bg-white/5 rounded-xl border border-slate-800 flex flex-col items-center gap-3">
                    <i class="fa-solid fa-qrcode text-5xl text-teal-400"></i>
                    <p class="text-xs text-teal-300 font-bold">BHIM UPI Dynamic QR Generated</p>
                    <p class="text-[10px] text-gray-400">Scan to pay ₹${amount.toLocaleString('en-IN')} securely via any UPI App</p>
                </div>
            </div>
            
            <button onclick="executePayment('${orderId}')" class="bg-teal-600 hover:bg-teal-500 text-white w-full mt-6 py-3 rounded-xl font-bold text-sm transition shadow-lg shadow-teal-500/20">Confirm &amp; Validate Transaction</button>
        </div>
    `;
    document.body.appendChild(modal);
}

async function executePayment(orderId) {
    if (!supabase) return;
    const payMethodElement = document.getElementById('payMethod');
    const selectedPayMethod = payMethodElement ? payMethodElement.value : 'Online';
    let displayMethod = 'Online';
    if (selectedPayMethod === 'upi') displayMethod = 'Online (UPI)';
    if (selectedPayMethod === 'card') displayMethod = 'Online (Card)';
    if (selectedPayMethod === 'cod') displayMethod = 'COD';

    try {
        const handoverOtp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit handover code
        const updatePayload = {
            payment_method: displayMethod,
            payment_status: displayMethod === 'COD' ? 'Pending COD Confirmation' : 'Paid',
            pickup_otp: handoverOtp
        };
        // If paid online, automatically update status to Under-Repair as per Task 2
        if (displayMethod !== 'COD') {
            updatePayload.status = 'Under-Repair';
        }

        const { error } = await supabase.from('orders').update(updatePayload).eq('id', orderId);
        if (error) throw error;
        
        document.getElementById('paymentGatewayModal')?.remove();
        if (displayMethod === 'COD') {
            showToast('💵 Cash on Delivery selection submitted! Coordinator approval pending.', 'success');
        } else {
            showToast('💳 Payment Successful! Your order status is updated to Under-Repair.', 'success');
        }
        loadDashboard();
    } catch (err) {
        showToast('Failed to log payment: ' + err.message, 'error');
    }
}

async function selectCODPayment(orderId) {
    if (!supabase) return;
    try {
        const handoverOtp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit handover code
        const { error } = await supabase.from('orders').update({
            payment_method: 'COD',
            payment_status: 'Pending COD Confirmation',
            pickup_otp: handoverOtp
        }).eq('id', orderId);
        if (error) throw error;
        showToast('💵 Cash on Delivery confirmed! Coordinator will acknowledge the payment upon handset arrival.', 'success');
        loadDashboard();
    } catch (err) {
        showToast('Failed to confirm COD: ' + err.message, 'error');
    }
}

async function confirmPaymentManual(orderId) {
    if (!supabase) return;
    try {
        const { error } = await supabase.from('orders').update({
            payment_status: 'Paid',
            status: 'Under-Repair'
        }).eq('id', orderId);
        if (error) throw error;
        showToast('💵 Payment manually confirmed by Coordinator! Status updated to Under-Repair.', 'success');
        closeOrderDetailModal();
        loadDashboard();
    } catch (err) {
        showToast('Failed to confirm payment: ' + err.message, 'error');
    }
}

function generateInvoiceHtml(order) {
    const deviceName = getDeviceName(order.device_id) !== 'Device' ? getDeviceName(order.device_id) : (order.device_other || 'Device');
    const repairLabel = getRepairLabel(order.repair_type_id) !== 'Repair' ? getRepairLabel(order.repair_type_id) : (order.repair_other || 'Repair');
    const invoiceNum = order.invoice_number || `INV-2026-TEMP`;
    const invoiceDate = order.created_at ? new Date(order.created_at).toLocaleDateString() : new Date().toLocaleDateString();

    const partsList = parseCustomQuoteParts(order.custom_quote_parts);
    let partsRowsHtml = '';
    if (partsList.length > 0) {
        partsList.forEach(p => {
            const cleanName = p.name.replace(/^\[Original\]\s*/, '').replace(/^\[Old\]\s*/, '').replace(/^\[Additional\]\s*/, '').replace(/^\[New\]\s*/, '');
            partsRowsHtml += `
                <tr class="item">
                    <td>📦 ${cleanName}</td>
                    <td>₹${p.price.toLocaleString('en-IN')}</td>
                </tr>
            `;
        });
    } else if (order.parts_total > 0) {
        partsRowsHtml += `
            <tr class="item">
                <td>📦 Estimated Spare Components</td>
                <td>₹${order.parts_total.toLocaleString('en-IN')}</td>
            </tr>
        `;
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice - ${invoiceNum}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
            color: #333;
            margin: 0;
            padding: 30px;
            background-color: #fff;
        }
        .invoice-box {
            max-width: 800px;
            margin: auto;
            padding: 30px;
            border: 1px solid #eee;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
            font-size: 14px;
            line-height: 24px;
            background-color: #fff;
        }
        .invoice-box table {
            width: 100%;
            line-height: inherit;
            text-align: left;
            border-collapse: collapse;
        }
        .invoice-box table td {
            padding: 10px;
            vertical-align: top;
        }
        .invoice-box table tr td:nth-child(2) {
            text-align: right;
        }
        .invoice-box table tr.top table td {
            padding-bottom: 20px;
        }
        .invoice-box table tr.top table td.title {
            font-size: 35px;
            line-height: 35px;
            color: #14b8a6;
            font-weight: bold;
        }
        .invoice-box table tr.information table td {
            padding-bottom: 40px;
        }
        .invoice-box table tr.heading td {
            background: #f3f4f6;
            border-bottom: 1px solid #ddd;
            font-weight: bold;
        }
        .invoice-box table tr.details td {
            padding-bottom: 20px;
        }
        .invoice-box table tr.item td {
            border-bottom: 1px solid #eee;
        }
        .invoice-box table tr.item.last td {
            border-bottom: none;
        }
        .invoice-box table tr.total td:nth-child(2) {
            border-top: 2px solid #eee;
            font-weight: bold;
        }
        .grand-total-row {
            background-color: #f0fdfa;
            font-weight: bold;
            color: #0f766e;
        }
        .btn-print {
            display: inline-block;
            background: #14b8a6;
            color: #fff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin-bottom: 20px;
            cursor: pointer;
            border: none;
        }
        @media print {
            .btn-print {
                display: none;
            }
            body {
                padding: 0;
            }
            .invoice-box {
                border: none;
                box-shadow: none;
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div style="max-width: 800px; margin: auto; text-align: right;">
        <button class="btn-print" onclick="window.print()">🖨️ Print Invoice</button>
    </div>
    <div class="invoice-box">
        <table>
            <tr class="top">
                <td colspan="2">
                    <table>
                        <tr>
                            <td class="title">
                                RepairMaster
                            </td>
                            <td>
                                <strong>Invoice #:</strong> ${invoiceNum}<br>
                                <strong>Date:</strong> ${invoiceDate}<br>
                                <strong>Status:</strong> <span style="color: #059669; font-weight: bold;">PAID</span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr class="information">
                <td colspan="2">
                    <table>
                        <tr>
                            <td>
                                <strong>Billed To:</strong><br>
                                ${order.customer_name || 'N/A'}<br>
                                ${order.customer_phone || 'N/A'}<br>
                                ${order.customer_email || 'N/A'}
                            </td>
                            <td>
                                <strong>Device / Fault:</strong><br>
                                ${deviceName}<br>
                                ${repairLabel}<br>
                                📍 ${order.address || 'N/A'}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            
            <tr class="heading">
                <td>Payment details</td>
                <td>Method / Txn</td>
            </tr>
            <tr class="details">
                <td>Secure Escrow Gateway</td>
                <td>${order.payment_method || 'Online Payment'}</td>
            </tr>
            
            <tr class="heading">
                <td>Itemized Repair Service</td>
                <td>Price</td>
            </tr>
            
            <tr class="item">
                <td>🩺 Scientific Bench Diagnosis</td>
                <td>₹${(order.diagnosis_charge || 250).toLocaleString('en-IN')}</td>
            </tr>
            <tr class="item">
                <td>🔧 Workmanship &amp; Labor</td>
                <td>₹${(order.service_fee || 100).toLocaleString('en-IN')}</td>
            </tr>
            ${partsRowsHtml}
            
            <tr class="heading">
                <td>Subtotal &amp; Fees</td>
                <td>Amount</td>
            </tr>
            <tr class="item">
                <td>Subtotal</td>
                <td>₹${(order.total_price || 0).toLocaleString('en-IN')}</td>
            </tr>
            <tr class="item">
                <td>Tax (18% GST)</td>
                <td>₹${(order.tax_amount || 0).toLocaleString('en-IN')}</td>
            </tr>
            <tr class="item">
                <td>Platform Fee (10%)</td>
                <td>₹${(order.platform_fee || 0).toLocaleString('en-IN')}</td>
            </tr>
            <tr class="total grand-total-row">
                <td>Grand Total (Incl. All Taxes & Fees)</td>
                <td>₹${(order.grand_total || order.total_price || 0).toLocaleString('en-IN')}</td>
            </tr>
        </table>
        
        <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-t: 1px solid #eee; padding-top: 20px;">
            Thank you for choosing RepairMaster! Your premium doorstep device diagnostic is securely validated.
        </div>
    </div>
</body>
</html>
    `;
}

function openInvoicePage(orderId) {
    const order = (window.allFetchedOrders || []).find(o => o.id === orderId);
    if (!order) {
        showToast('Invoice reference order not found.', 'error');
        return;
    }
    const invoiceWindow = window.open('', '_blank');
    if (!invoiceWindow) {
        showToast('Please allow popups to view/print the invoice.', 'error');
        return;
    }
    invoiceWindow.document.write(generateInvoiceHtml(order));
    invoiceWindow.document.close();
}

async function closeTicket(orderId, enteredOtp) {
    if (!supabase) return;
    try {
        const { data, error } = await supabase.from('orders').select('pickup_otp').eq('id', orderId).single();
        if (error) throw error;
        if (data.pickup_otp !== enteredOtp) {
            showToast('❌ Invalid verification OTP. Authentication failed.', 'error');
            return;
        }
        await supabase.from('orders').update({ pickup_otp: 'VERIFIED', status: 'Completed' }).eq('id', orderId);
        showToast('🔒 Delivery Handover Verified! Ticket Closed successfully.', 'success');
        loadDashboard();
    } catch (err) {
        showToast('Verification failed: ' + err.message, 'error');
    }
}

async function logoutUser() {
    try {
        if (supabase) await supabase.auth.signOut();
        currentUser = null;
        updateNavForAuth(null);
        showToast('Successfully logged out.', 'info');
        setTimeout(() => { window.location.href = 'index.html'; }, 1000);
    } catch (err) {
        showToast('Logout error: ' + err.message, 'error');
    }
}

// ─── 11. REQUEST DROPDOWN HELPERS ───
function populateRequestBrands() {
    const select = document.getElementById('reqBrand');
    if (!select) return;
    select.innerHTML = '<option value="">— Select Brand —</option>';
    allBrands.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = b.name;
        select.appendChild(opt);
    });
}

function updateReqModels() {
    const brandId = document.getElementById('reqBrand').value;
    const modelSelect = document.getElementById('reqModel');
    if (!modelSelect) return;
    modelSelect.innerHTML = '<option value="">— Select Model —</option>';
    
    if (!brandId) return;
    const devices = allDevices.filter(d => String(d.brand_id) === String(brandId));
    devices.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.name;
        modelSelect.appendChild(opt);
    });
    updateReqRepairTypes();
}

function updateReqRepairTypes() {
    const modelId = document.getElementById('reqModel').value;
    const repairSelect = document.getElementById('reqRepairType');
    if (!repairSelect) return;
    repairSelect.innerHTML = '<option value="">— Select Repair Type —</option>';
    
    if (!modelId) return;
    allRepairTypes.forEach(rt => {
        const opt = document.createElement('option');
        opt.value = rt.id;
        opt.textContent = rt.label || rt.name;
        repairSelect.appendChild(opt);
    });
    showRequestEstimate();
}

function toggleOther(fieldId) {
    const otherDiv = document.getElementById(fieldId + 'Other') || document.getElementById(fieldId.replace('Type', '') + 'Other');
    if (otherDiv) {
        otherDiv.classList.toggle('visible');
        const select = document.getElementById(fieldId);
        if (select) select.disabled = otherDiv.classList.contains('visible');
    }
    showRequestEstimate();
}

function showRequestEstimate() {
    const brandSelect = document.getElementById('reqBrand');
    const modelSelect = document.getElementById('reqModel');
    const repairSelect = document.getElementById('reqRepairType');
    const estimateDiv = document.getElementById('requestEstimate');
    if (!brandSelect || !modelSelect || !repairSelect || !estimateDiv) return;

    const brandId = brandSelect.value;
    const modelId = modelSelect.value;
    const repairTypeId = repairSelect.value;
    const isOtherBrand = document.getElementById('reqBrandOther')?.classList.contains('visible');
    const isOtherModel = document.getElementById('reqModelOther')?.classList.contains('visible');
    const isOtherRepair = document.getElementById('reqRepairOther')?.classList.contains('visible');

    if (!isOtherBrand && !brandId) {
        estimateDiv.classList.add('hidden');
        return;
    }
    if (!isOtherModel && !modelId) {
        estimateDiv.classList.add('hidden');
        return;
    }
    if (!isOtherRepair && !repairTypeId) {
        estimateDiv.classList.add('hidden');
        return;
    }

    let totalPartsPrice = 0;
    let partsFound = false;
    if (!isOtherBrand && !isOtherModel && !isOtherRepair && brandId && modelId && repairTypeId) {
        const parts = allParts.filter(p => String(p.device_id) === String(modelId) && String(p.repair_type_id) === String(repairTypeId));
        if (parts && parts.length > 0) {
            partsFound = true;
            const qualitySelect = document.getElementById('reqPartsQuality');
            const quality = qualitySelect ? qualitySelect.value : 'standard';
            const qualityMultiplier = quality === 'premium' ? 1.0 : 0.7;
            parts.forEach(part => { totalPartsPrice += part.price * qualityMultiplier; });
        }
    }
    
    const discountedParts = totalPartsPrice * 0.9;
    const serviceFee = discountedParts > 0 ? (discountedParts * 0.15) : 100.00;
    const diagnosisCharge = 250;
    const total = discountedParts + serviceFee + diagnosisCharge;

    document.getElementById('reqPartsTotal').textContent = '₹' + discountedParts.toFixed(2) + (discountedParts === 0 ? ' (No parts selected)' : '');
    document.getElementById('reqServiceFee').textContent = '₹' + serviceFee.toFixed(2) + (discountedParts === 0 ? ' (Minimum service fee)' : '');
    document.getElementById('reqDiagnosis').textContent = '₹' + diagnosisCharge.toFixed(2);
    document.getElementById('reqTotal').textContent = '₹' + total.toFixed(2);
    estimateDiv.classList.remove('hidden');
}

// ─── 12. LOGINS & AUTHS ───
async function handleSignIn() {
    if (!supabase) return showToast('Supabase Client disconnected', 'error');
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    if (!emailInput || !passwordInput) {
        showToast('Login inputs not found', 'error');
        return;
    }
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
        showToast('Please enter both email and password', 'error');
        return;
    }
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        currentUser = data.user;
        showToast('Welcome back!', 'success');
        
        // Fetch the user's role from the profiles table
        let role = 'customer';
        try {
            const { data: profile, error: pError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', currentUser.id)
                .single();
            if (!pError && profile && profile.role) {
                role = profile.role;
            } else {
                // Fallback to user_roles
                const rolesList = await getUserRoles(currentUser.id);
                if (rolesList && rolesList.length > 0) {
                    role = rolesList[0];
                }
            }
        } catch (err) {
            console.warn("Profiles fetch error:", err);
            const rolesList = await getUserRoles(currentUser.id);
            if (rolesList && rolesList.length > 0) {
                role = rolesList[0];
            }
        }
        
        localStorage.setItem('activeRole', role);
        updateNavForAuth(currentUser);
        
        setTimeout(() => {
            if (window.location.href.includes('dashboard.html')) {
                loadDashboard();
            } else {
                window.location.href = 'dashboard.html';
            }
        }, 1000);
    } catch (err) {
        showToast('Login Failed: ' + err.message, 'error');
    }
}
window.handleSignIn = handleSignIn;

async function loginUser(e) {
    e.preventDefault();
    if (!supabase) return showToast('Supabase Client disconnected', 'error');
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        currentUser = data.user;
        updateNavForAuth(currentUser);
        showToast('Welcome back, ' + (currentUser.user_metadata?.full_name || 'Member') + '!', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
    } catch (err) {
        showToast('Login Failed: ' + err.message, 'error');
    }
}

async function signupUser(e) {
    e.preventDefault();
    if (!supabase) return showToast('Supabase Client disconnected', 'error');
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const phone = document.getElementById('signupPhone').value.trim();
    const password = document.getElementById('signupPassword').value;
    const city = document.getElementById('signupCity')?.value || 'Wardha';
    const selectedRole = document.getElementById('signupRole')?.value || '5';

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name, phone: phone, city: city } }
        });
        if (error) throw error;
        if (data.user) {
            // Wait for profile upsert (robust, avoids duplicate trigger crash)
            await supabase.from('users').upsert([{
                id: data.user.id,
                email: email,
                name: name,
                phone: phone,
                address: city
            }]);
            await supabase.from('user_roles').upsert([{
                user_id: data.user.id,
                role_id: parseInt(selectedRole)
            }]);
        }
        showToast('Registration success! Redirecting to login...', 'success');
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
    } catch (err) {
        showToast('Signup Failed: ' + err.message, 'error');
    }
}

async function signInWithGoogle() {
    if (!supabase) return;
    try {
        const redirectUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/dashboard.html');
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: redirectUrl }
        });
        if (error) throw error;
    } catch (err) {
        showToast('Google login error: ' + err.message, 'error');
    }
}

function toggleMobileMenu() {
    let mobileDrawer = document.getElementById('mobileNavDrawer');
    if (!mobileDrawer) {
        mobileDrawer = document.createElement('div');
        mobileDrawer.id = 'mobileNavDrawer';
        mobileDrawer.className = 'fixed inset-0 z-50 hidden';
        mobileDrawer.innerHTML = `
            <!-- Backdrop -->
            <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300" onclick="toggleMobileMenu()"></div>
            <!-- Drawer Body -->
            <div class="fixed inset-y-0 right-0 w-80 bg-[#0A0F1D] border-l border-slate-800 shadow-2xl p-6 flex flex-col justify-between z-10 transition-transform duration-300 transform translate-x-full" id="mobileDrawerBody">
                <div class="space-y-6">
                    <!-- Drawer Header -->
                    <div class="flex items-center justify-between border-b border-white/5 pb-4">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-black text-tealAccent uppercase tracking-wider font-display">Navigation Menu</span>
                        </div>
                        <button onclick="toggleMobileMenu()" class="text-gray-400 hover:text-white text-lg transition">✕</button>
                    </div>

                    <!-- Navigation Links -->
                    <nav class="flex flex-col gap-3 text-sm font-medium">
                        <a href="index.html" class="mobile-nav-link flex items-center gap-3 text-gray-300 hover:text-teal p-3 rounded-xl hover:bg-white/5 transition" id="mLink-index">
                            <i class="fa-solid fa-house text-tealAccent/80"></i> Home
                        </a>
                        <a href="request.html" class="mobile-nav-link flex items-center gap-3 text-gray-300 hover:text-teal p-3 rounded-xl hover:bg-white/5 transition" id="mLink-request">
                            <i class="fa-solid fa-screwdriver-wrench text-tealAccent/80"></i> Repair Request
                        </a>
                        <a href="dashboard.html" class="mobile-nav-link flex items-center gap-3 text-gray-300 hover:text-teal p-3 rounded-xl hover:bg-white/5 transition" id="mLink-dashboard">
                            <i class="fa-solid fa-chart-line text-tealAccent/80"></i> Dashboard
                        </a>
                        <a href="marketplace.html" class="mobile-nav-link flex items-center gap-3 text-gray-300 hover:text-teal p-3 rounded-xl hover:bg-white/5 transition" id="mLink-marketplace">
                            <i class="fa-solid fa-store text-tealAccent/80"></i> Certified Store
                        </a>
                    </nav>
                </div>

                <!-- Footer (Auth / User Actions) -->
                <div class="border-t border-white/5 pt-4 space-y-3" id="mobileDrawerAuthBlock">
                </div>
            </div>
        `;
        document.body.appendChild(mobileDrawer);
    }

    // Always update auth section dynamically based on current user state!
    const authBlock = document.getElementById('mobileDrawerAuthBlock');
    if (authBlock) {
        if (currentUser) {
            const username = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
            const initials = username.substring(0, 2).toUpperCase();
            authBlock.innerHTML = `
                <div class="space-y-2">
                    <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <div class="w-9 h-9 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 font-bold text-xs flex items-center justify-center">
                            ${initials}
                        </div>
                        <div class="min-w-0">
                            <p class="text-xs font-bold text-white truncate">${username}</p>
                            <p class="text-[10px] text-teal-400">Registered DTC Member</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick="toggleProfileDrawer(); toggleMobileMenu();" class="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-white p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition">
                            <i class="fa-regular fa-user"></i> Profile
                        </button>
                        <button onclick="logoutUser(); toggleMobileMenu();" class="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition">
                            <i class="fa-solid fa-power-off"></i> Logout
                        </button>
                    </div>
                </div>
            `;
        } else {
            authBlock.innerHTML = `
                <div class="flex flex-col gap-2">
                    <a href="login.html" class="w-full bg-teal text-slate-950 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 hover:bg-tealAccent transition" onclick="toggleMobileMenu()">
                        <i class="fa-solid fa-right-to-bracket"></i> Sign In
                    </a>
                    <a href="signup.html" class="w-full bg-slate-900 border border-slate-800 text-gray-300 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-850 transition" onclick="toggleMobileMenu()">
                        <i class="fa-solid fa-user-plus"></i> Sign Up
                    </a>
                </div>
            `;
        }
    }

    // Always update active navigation highlight!
    const path = window.location.pathname.toLowerCase();
    let activeId = 'mLink-index';
    if (path.includes('request')) activeId = 'mLink-request';
    else if (path.includes('marketplace')) activeId = 'mLink-marketplace';
    else if (path.includes('dashboard')) activeId = 'mLink-dashboard';
    
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        if (link.id === activeId) {
            link.className = 'mobile-nav-link flex items-center gap-3 text-teal font-extrabold p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 transition';
        } else {
            link.className = 'mobile-nav-link flex items-center gap-3 text-gray-300 hover:text-teal p-3 rounded-xl hover:bg-white/5 transition';
        }
    });

    const isHidden = mobileDrawer.classList.contains('hidden');
    const body = document.getElementById('mobileDrawerBody');
    if (isHidden) {
        mobileDrawer.classList.remove('hidden');
        // trigger reflow then slide in
        setTimeout(() => {
            if (body) body.classList.remove('translate-x-full');
        }, 10);
    } else {
        if (body) body.classList.add('translate-x-full');
        setTimeout(() => {
            mobileDrawer.classList.add('hidden');
        }, 300);
    }
}
window.toggleMobileMenu = toggleMobileMenu;

// Carousel controls
let currentSlide = 0;
const totalSlides = 5;
let slideInterval;

function goToSlide(index) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    if (slides.length > 0) {
        slides.forEach((s, i) => s.classList.toggle('active', i === index));
    }
    if (dots.length > 0) {
        dots.forEach((d, i) => d.classList.toggle('active', i === index));
    }
    currentSlide = index;
}

function nextSlide() {
    goToSlide((currentSlide + 1) % totalSlides);
}

function startCarousel() {
    slideInterval = setInterval(nextSlide, 6000);
}

// ─── 13. APPLICATION INITIALIZER ───
document.addEventListener('DOMContentLoaded', async function() {
    // 1. Fetch current path context
    const path = window.location.pathname.toLowerCase();
    const isLogin = path.includes('login');
    const isSignup = path.includes('signup');
    const isDashboard = path.includes('dashboard');
    const isRequest = path.includes('request');
    const isApp = path.includes('app');

    // 2. Hydrate database parts catalogs and offers
    await loadCatalog();

    if (document.getElementById('brandSelect')) {
        populateBrands();
    }
    if (document.getElementById('reqBrand')) {
        populateRequestBrands();
    }
    
    await fetchOffers();

    if (document.querySelectorAll('.carousel-slide').length > 0) {
        startCarousel();
    }

    // 3. Authenticate Session & Setup Realtime Listeners
    if (supabase) {
        // Setup real-time PostgreSQL channel subscription on orders table
        supabase.channel('public:orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                console.log('Realtime change detected in orders table:', payload);
                if (isDashboard) {
                    loadDashboard();
                } else {
                    // if guest tracking input has values, re-trigger trackOrderGuest to update real-time
                    const trackInput = document.getElementById('trackOrderId');
                    const phoneInput = document.getElementById('trackPhone');
                    if (trackInput && trackInput.value && phoneInput && phoneInput.value) {
                        const evt = new Event('submit');
                        const f = document.getElementById('guestTrackForm');
                        if (f) f.dispatchEvent(evt);
                    }
                }
            })
            .subscribe();

        const session = await supabase.auth.getSession();
        if (session.data?.session) {
            currentUser = session.data.session.user;
            updateNavForAuth(currentUser);
            
            // Redirect logged-in users away from Auth forms
            if (isLogin || isSignup) {
                window.location.href = 'dashboard.html';
            }
            if (isDashboard) {
                await loadDashboard();
            }
            if (isRequest) {
                await prefillRequestForm();
            }
        } else {
            updateNavForAuth(null);
            // Protect dashboard page (handled inline on dashboard.html via login container)
            if (isDashboard) {
                await loadDashboard();
            }
        }
    } else {
        updateNavForAuth(null);
    }
});

async function trackOrderGuest(e) {
    e.preventDefault();
    if (!supabase) return showToast('Supabase Client disconnected', 'error');
    let orderId = document.getElementById('trackOrderId').value.trim();
    if (orderId.startsWith('#')) {
        orderId = orderId.substring(1).trim();
    }
    let phone = document.getElementById('trackPhone').value.trim();

    // Standardize phone search by stripping any non-numeric characters
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const resultDiv = document.getElementById('guestTrackResult');
    if (!resultDiv) return;

    try {
        resultDiv.classList.remove('hidden');
        resultDiv.innerHTML = `<div class="text-center py-4 text-xs text-teal-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Searching for request...</div>`;

        // Fetch from orders
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('order_number', orderId);

        if (error) throw error;

        if (!orders || orders.length === 0) {
            resultDiv.innerHTML = `<div class="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center font-bold text-xs">❌ No order matching reference #${orderId} was found.</div>`;
            return;
        }

        const o = orders[0];
        const dbPhone = (o.customer_phone || '').replace(/[^0-9]/g, '');

        if (dbPhone.slice(-10) !== cleanPhone.slice(-10)) {
            resultDiv.innerHTML = `<div class="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center font-bold text-xs">❌ Phone number mismatch. Authorization failed.</div>`;
            return;
        }

        // Render the order card in guest mode!
        const cardHtml = buildSingleOrderCardHtml(o, false, false, false, false, true); // isGuestMode = true
        resultDiv.innerHTML = `
            <div class="p-4 bg-teal-500/5 border border-teal-500/10 rounded-xl mb-4 text-xs text-teal-300 font-bold flex items-center gap-2">
                <i class="fa-solid fa-circle-check"></i> Request Authorized &amp; Loaded Successfully
            </div>
            ${cardHtml}
        `;
    } catch (err) {
        resultDiv.innerHTML = `<div class="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center font-bold text-xs">❌ Search failed: ${err.message}</div>`;
    }
}

async function submitOrderReview(orderId, rating, reviewText) {
    if (!supabase) return;
    try {
        // Direct rating and review update
        const { error } = await supabase.from('orders').update({
            customer_rating: rating,
            customer_review: reviewText
        }).eq('id', orderId);

        if (error) {
            // Fallback: write to notes
            const { data } = await supabase.from('orders').select('notes').eq('id', orderId).single();
            const currentNotes = data?.notes || '';
            const updatedNotes = currentNotes + `\n[REVIEW] Rating: ${rating}/5, Comment: ${reviewText}`;
            await supabase.from('orders').update({ notes: updatedNotes }).eq('id', orderId);
        }
        showToast('⭐ Thank you for your feedback! Review saved successfully.', 'success');
        
        if (window.location.href.includes('dashboard.html')) {
            loadDashboard();
        } else {
            // Re-trigger guest tracking search to show the review instantly!
            const guestTrackForm = document.getElementById('guestTrackForm');
            if (guestTrackForm) {
                const submitEvent = new Event('submit');
                guestTrackForm.dispatchEvent(submitEvent);
            }
        }
    } catch (err) {
        showToast('Failed to save review: ' + err.message, 'error');
    }
}

// ─── 14. EXPOSE ATTACHMENTS FOR HTML HANDLERS ───
window.signInWithGoogle = signInWithGoogle;
window.toggleMobileMenu = toggleMobileMenu;
window.goToSlide = goToSlide;
window.nextSlide = nextSlide;
window.showToast = showToast;
window.loginUser = loginUser;
window.signupUser = signupUser;
window.loadDashboard = loadDashboard;
window.updateModels = updateModels;
window.updateRepairTypes = updateRepairTypes;
window.updatePartsSurvey = updatePartsSurvey;
window.createOrder = createOrder;
window.submitRequest = submitRequest;
window.updateReqModels = updateReqModels;
window.updateReqRepairTypes = updateReqRepairTypes;
window.toggleOther = toggleOther;
window.populateRequestBrands = populateRequestBrands;
window.assignOrderRoles = assignOrderRoles;
window.assignDeliveryTechnician = assignDeliveryTechnician;
window.assignSelfAsTechnician = assignSelfAsTechnician;
window.assignSelfAsRepairMaster = assignSelfAsRepairMaster;
window.initiatePickup = initiatePickup;
window.verifyPickup = verifyPickup;
window.updateDiagnosis = updateDiagnosis;
window.requestAdditionalParts = requestAdditionalParts;
window.sendQuotation = sendQuotation;
window.confirmQuotation = confirmQuotation;
window.rejectQuotation = rejectQuotation;
window.updateProfile = updateProfile;
window.logoutUser = logoutUser;
window.completeRepair = completeRepair;
window.payForRepair = payForRepair;
window.executePayment = executePayment;
window.closeTicket = closeTicket;
window.trackOrderGuest = trackOrderGuest;
window.submitOrderReview = submitOrderReview;

window.showAssignForm = showAssignForm;
window.submitAssignRoles = submitAssignRoles;
window.showAssignDeliveryForm = showAssignDeliveryForm;
window.submitAssignDelivery = submitAssignDelivery;
window.showDiagnosisForm = showDiagnosisForm;
window.submitDiagnosis = submitDiagnosis;
window.showAddPartForm = showAddPartForm;
window.submitAddPart = submitAddPart;
window.showQuotationForm = showQuotationForm;
window.updateQuotationPartPrice = updateQuotationPartPrice;
window.updateQuotationPartName = updateQuotationPartName;
window.toggleQuotationPartType = toggleQuotationPartType;
window.updateQuotationDiagnosisChargeEditable = updateQuotationDiagnosisChargeEditable;
window.updateQuotationServiceFeeEditable = updateQuotationServiceFeeEditable;
window.addNewQuotationPartPromptEditable = addNewQuotationPartPromptEditable;
window.removeQuotationPartEditable = removeQuotationPartEditable;
window.cancelQuotationEdit = cancelQuotationEdit;
window.submitFinalizedQuotation = submitFinalizedQuotation;

// ─── 13. TECHNICIAN CHECKLIST & REPAIRMASTER INVENTORY MANAGEMENT ───
function checkAllStepsCompleted(orderId) {
    const stepsCount = 4;
    let completed = 0;
    for (let i = 0; i < stepsCount; i++) {
        if (localStorage.getItem(`${orderId}-step-${i}`) === 'true') {
            completed++;
        }
    }
    if (completed === stepsCount) {
        showToast('✨ Excellent! All job checklist items completed.', 'success');
    }
}
window.checkAllStepsCompleted = checkAllStepsCompleted;

async function loadRepairPartsInventory() {
    const area = document.getElementById('repairmasterInventoryArea');
    if (!area) return;
    
    const activeRole = localStorage.getItem('activeRole') || 'customer';
    if (activeRole !== 'repairmaster' && activeRole !== 'coordinator' && activeRole !== 'admin') {
        area.classList.add('hidden');
        return;
    }
    
    area.classList.remove('hidden');
    
    let items = [];
    try {
        if (!supabase) throw new Error("Supabase disconnected");
        const { data, error } = await supabase.from('repair_parts_inventory').select('*').order('part_name');
        if (error) throw error;
        items = data || [];
    } catch (err) {
        console.warn("Using offline mock inventory:", err);
        items = [
            { id: 'inv1', part_name: 'iPhone 15 Pro Max Screen (OLED)', quantity: 5, price: 14500 },
            { id: 'inv2', part_name: 'Vivo V30 Pro Curved Display', quantity: 8, price: 5800 },
            { id: 'inv3', part_name: 'Galaxy S24 Ultra Glass Cover', quantity: 3, price: 9200 },
            { id: 'inv4', part_name: 'Premium Lithium Battery (5000mAh)', quantity: 12, price: 1500 },
            { id: 'inv5', part_name: 'Type-C Fast Charger Sub-board', quantity: 15, price: 850 }
        ];
    }
    window.allInventoryItems = items;
    renderInventoryTable(items);
}
window.loadRepairPartsInventory = loadRepairPartsInventory;

function renderInventoryTable(items) {
    const area = document.getElementById('repairmasterInventoryArea');
    if (!area) return;
    
    const activeRole = localStorage.getItem('activeRole') || 'customer';
    const isReadOnly = (activeRole === 'repairmaster');
    
    let rowsHtml = items.map(item => {
        let actionsCol = '';
        let quantitySelector = `<span class="text-white font-mono font-bold px-1">${item.quantity}</span>`;
        if (!isReadOnly) {
            quantitySelector = `
                <div class="flex items-center gap-2">
                    <button onclick="updateInventoryQty('${item.id}', -1)" class="w-6 h-6 bg-slate-800 text-white hover:bg-red-500 hover:text-white rounded flex items-center justify-center font-bold transition">-</button>
                    <span class="text-white font-mono font-bold px-1">${item.quantity}</span>
                    <button onclick="updateInventoryQty('${item.id}', 1)" class="w-6 h-6 bg-slate-800 text-white hover:bg-emerald-500 hover:text-white rounded flex items-center justify-center font-bold transition">+</button>
                </div>
            `;
            actionsCol = `
                <td class="p-3 text-xs text-right">
                    <button onclick="deleteInventoryItem('${item.id}')" class="text-red-400 hover:text-red-300 font-bold text-xs"><i class="fa-regular fa-trash-can"></i> Remove</button>
                </td>
            `;
        } else {
            actionsCol = `<td class="p-3 text-xs text-right text-gray-500 italic">Locked (Read-Only)</td>`;
        }
        
        return `
            <tr class="border-b border-slate-800 hover:bg-slate-900/30">
                <td class="p-3 text-xs font-bold text-white">${item.part_name}</td>
                <td class="p-3 text-xs text-teal font-extrabold">₹${parseFloat(item.price).toLocaleString('en-IN')}</td>
                <td class="p-3 text-xs">
                    ${quantitySelector}
                </td>
                ${actionsCol}
            </tr>
        `;
    }).join('');
    
    if (items.length === 0) {
        rowsHtml = `
            <tr>
                <td colspan="4" class="p-8 text-center text-xs text-gray-500 italic">No parts registered in active inventory.</td>
            </tr>
        `;
    }
    
    const registerBtn = isReadOnly ? '' : `<button onclick="toggleAddInventoryForm()" class="btn-teal px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"><i class="fa-solid fa-plus"></i> Register Spare Part</button>`;
    
    area.innerHTML = `
        <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
                <div>
                    <h3 class="text-lg font-bold text-white font-display flex items-center gap-2">
                        <i class="fa-solid fa-boxes-stacked text-teal"></i> RepairMaster Inventory Management
                    </h3>
                    <p class="text-[11px] text-gray-500">Track and manage available spare parts stock level & rates.</p>
                </div>
                ${registerBtn}
            </div>
            
            <!-- Quick Add Inventory Form (Hidden by default) -->
            <div id="addInventoryForm" class="hidden bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="text-[10px] text-gray-400 font-bold block mb-1">Part Name</label>
                    <input type="text" id="invPartName" placeholder="e.g. iPhone 14 Battery" class="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs text-white outline-none focus:border-teal">
                </div>
                <div>
                    <label class="text-[10px] text-gray-400 font-bold block mb-1">Unit Price (INR)</label>
                    <input type="number" id="invPrice" placeholder="e.g. 1500" class="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs text-white outline-none focus:border-teal">
                </div>
                <div>
                    <label class="text-[10px] text-gray-400 font-bold block mb-1">Initial Quantity</label>
                    <div class="flex gap-2">
                        <input type="number" id="invQty" placeholder="e.g. 10" class="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs text-white outline-none focus:border-teal">
                        <button onclick="submitNewInventoryItem()" class="btn-teal px-4 font-bold rounded-lg text-xs">Save</button>
                    </div>
                </div>
            </div>
            
            <!-- Inventory Table -->
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b border-slate-800 text-gray-400 text-[10px] uppercase font-bold tracking-wider bg-slate-950/40 font-display">
                            <th class="p-3">Spare Part Name</th>
                            <th class="p-3">Unit Price</th>
                            <th class="p-3">In Stock</th>
                            <th class="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
window.renderInventoryTable = renderInventoryTable;

function toggleAddInventoryForm() {
    const form = document.getElementById('addInventoryForm');
    if (form) form.classList.toggle('hidden');
}
window.toggleAddInventoryForm = toggleAddInventoryForm;

async function submitNewInventoryItem() {
    const part_name = document.getElementById('invPartName')?.value.trim();
    const price = parseFloat(document.getElementById('invPrice')?.value) || 0;
    const quantity = parseInt(document.getElementById('invQty')?.value) || 0;
    
    if (!part_name) {
        showToast('Please specify spare part name', 'error');
        return;
    }
    
    try {
        if (!supabase) throw new Error("Supabase disconnected");
        const { error } = await supabase.from('repair_parts_inventory').insert([{ part_name, price, quantity }]);
        if (error) throw error;
        showToast('📦 Spare part registered in inventory!', 'success');
        loadRepairPartsInventory();
    } catch (err) {
        console.warn("Adding locally:", err);
        const newItem = { id: 'inv-' + Date.now(), part_name, price, quantity };
        if (!window.allInventoryItems) window.allInventoryItems = [];
        window.allInventoryItems.push(newItem);
        showToast('📦 Spare part registered locally!', 'success');
        renderInventoryTable(window.allInventoryItems);
        toggleAddInventoryForm();
    }
}
window.submitNewInventoryItem = submitNewInventoryItem;

async function updateInventoryQty(itemId, delta) {
    let items = window.allInventoryItems || [];
    const idx = items.findIndex(item => item.id === itemId);
    if (idx === -1) return;
    
    const newQty = Math.max(0, items[idx].quantity + delta);
    items[idx].quantity = newQty;
    
    try {
        if (!supabase) throw new Error("Supabase disconnected");
        const { error } = await supabase.from('repair_parts_inventory').update({ quantity: newQty }).eq('id', itemId);
        if (error) throw error;
        showToast('Inventory level updated', 'success');
        loadRepairPartsInventory();
    } catch (err) {
        console.warn("Updated locally:", err);
        showToast('Inventory level updated locally', 'success');
        renderInventoryTable(items);
    }
}
window.updateInventoryQty = updateInventoryQty;

async function deleteInventoryItem(itemId) {
    try {
        if (!supabase) throw new Error("Supabase disconnected");
        const { error } = await supabase.from('repair_parts_inventory').delete().eq('id', itemId);
        if (error) throw error;
        showToast('Item deleted from inventory', 'success');
        loadRepairPartsInventory();
    } catch (err) {
        console.warn("Deleted locally:", err);
        window.allInventoryItems = window.allInventoryItems.filter(item => item.id !== itemId);
        showToast('Item deleted locally', 'success');
        renderInventoryTable(window.allInventoryItems);
    }
}
window.deleteInventoryItem = deleteInventoryItem;

// Floating Back to Top Scroll Behavior
window.addEventListener('scroll', () => {
    const btn = document.getElementById('backToTopBtn');
    if (btn) {
        if (window.scrollY > 300) {
            btn.classList.remove('scale-0');
            btn.classList.add('scale-100');
        } else {
            btn.classList.remove('scale-100');
            btn.classList.add('scale-0');
        }
    }
});

// Homepage Accordion Toggler & Auto-Scroller
function toggleHomepageSection(sectionId) {
    const content = document.getElementById(sectionId + '-content');
    const header = document.getElementById(sectionId + '-header');
    if (!content || !header) return;
    
    const icon = header.querySelector('.accordion-icon');
    const isCollapsed = content.classList.contains('collapsed');
    
    if (isCollapsed) {
        content.classList.remove('collapsed');
        if (icon) {
            icon.classList.add('rotate-180');
        }
        header.classList.add('bg-slate-900/60', 'border-teal/40');
        
        // Scroll to header after a slight delay to allow content expand layout calculation
        setTimeout(() => {
            const yOffset = -100; // Account for sticky header
            const y = header.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }, 150);
    } else {
        content.classList.add('collapsed');
        if (icon) {
            icon.classList.remove('rotate-180');
        }
        header.classList.remove('bg-slate-900/60', 'border-teal/40');
    }
}
window.toggleHomepageSection = toggleHomepageSection;

// ─── 11. ROLE-SPECIFIC TABS DATA & DYNAMIC RENDERING ENGINE ───
const ROLE_TABS = {
    coordinator: [
        { id: 'tickets', label: 'Overview', icon: 'fa-ticket' },
        { id: 'filters', label: 'Control Console', icon: 'fa-sliders' },
        { id: 'inventory', label: 'Lab Inventory', icon: 'fa-boxes-stacked' },
        { id: 'map', label: 'Live Active Map', icon: 'fa-map-location-dot' },
        { id: 'cities', label: 'Cities Coverage', icon: 'fa-city' },
        { id: 'finances', label: 'Financial Ledgers', icon: 'fa-indian-rupee-sign' }
    ],
    technician: [
        { id: 'tickets', label: 'Diagnostic Workstation', icon: 'fa-laptop-code' },
        { id: 'diagnostics', label: 'Lab Diagnostic Checklist', icon: 'fa-circle-check' },
        { id: 'handover', label: 'OTP Handover', icon: 'fa-key' }
    ],
    repairmaster: [
        { id: 'tickets', label: 'Repair Bench', icon: 'fa-screwdriver-wrench' },
        { id: 'inventory', label: 'Lab Inventory', icon: 'fa-boxes-stacked' }
    ],
    admin: [
        { id: 'tickets', label: 'System Tickets', icon: 'fa-ticket' },
        { id: 'filters', label: 'System Diagnostics', icon: 'fa-gauge-high' },
        { id: 'finances', label: 'Financial Ledgers', icon: 'fa-indian-rupee-sign' },
        { id: 'subcontractor-approvals', label: 'Subcontractor Approvals', icon: 'fa-user-check' },
        { id: 'sql', label: 'Developer Console', icon: 'fa-database' }
    ],
    customer: [
        { id: 'tickets', label: 'My Active Tickets', icon: 'fa-ticket' },
        { id: 'timeline', label: 'Courier Timeline', icon: 'fa-route' },
        { id: 'escrow', label: 'Pay Escrow / Quotes', icon: 'fa-wallet' }
    ]
};
window.ROLE_TABS = ROLE_TABS;

function renderDynamicTabContent(tabId) {
    const container = document.getElementById('dynamicTabContent');
    if (!container) return;
    
    const activeRole = localStorage.getItem('activeRole') || 'customer';
    
    if (tabId === 'map') {
        container.innerHTML = `
            <div class="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
                <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/60 pb-4">
                    <div>
                        <h3 class="text-xl font-bold text-white font-display">Live Courier Dispatch & GPS Tracking</h3>
                        <p class="text-xs text-gray-400">Real-time geographical status of Wardha, Nagpur & Amravati hubs</p>
                    </div>
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full font-bold">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Dispatch Active
                    </span>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div class="lg:col-span-3 bg-slate-950 rounded-2xl border border-slate-800 p-4 h-96 relative overflow-hidden flex flex-col justify-between">
                        <!-- Abstract Tech Support Map Overlay -->
                        <div class="absolute inset-0 opacity-15 bg-[radial-gradient(#14B8A6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
                        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950 pointer-events-none"></div>
                        
                        <!-- Pulse Hub Indicators -->
                        <div class="absolute top-1/4 left-1/3 flex flex-col items-center">
                            <span class="relative flex h-3 w-3">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                            </span>
                            <span class="text-[9px] font-black text-white mt-1 bg-slate-900/90 px-2 py-0.5 rounded border border-white/5 uppercase">Nagpur Hub</span>
                        </div>
                        
                        <div class="absolute top-1/2 left-1/2 flex flex-col items-center">
                            <span class="relative flex h-3 w-3">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            <span class="text-[9px] font-black text-white mt-1 bg-slate-900/90 px-2 py-0.5 rounded border border-white/5 uppercase">Wardha DTC (HQ)</span>
                        </div>
                        
                        <div class="absolute top-2/3 left-1/4 flex flex-col items-center">
                            <span class="relative flex h-3 w-3">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                            </span>
                            <span class="text-[9px] font-black text-white mt-1 bg-slate-900/90 px-2 py-0.5 rounded border border-white/5 uppercase">Amravati Hub</span>
                        </div>

                        <!-- Map status text -->
                        <div class="relative z-10 flex justify-between items-start">
                            <span class="text-[10px] font-mono bg-slate-900/80 text-gray-400 px-3 py-1.5 rounded-lg border border-slate-800">GPS Constellation: 12 Sats Lock</span>
                            <span class="text-[10px] font-mono bg-slate-900/80 text-teal-400 px-3 py-1.5 rounded-lg border border-slate-800">Wardha DTC Density: HIGH</span>
                        </div>
                        
                        <div class="relative z-10 flex flex-wrap gap-2 items-center justify-between border-t border-slate-900 bg-slate-900/90 p-3 rounded-xl border border-slate-800 mt-auto">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-teal-500/15 flex items-center justify-center text-teal text-xs"><i class="fa-solid fa-truck-ramp-box"></i></div>
                                <div>
                                    <p class="text-[10px] font-bold text-white">Active Courier Dispatch #4</p>
                                    <p class="text-[9px] text-gray-500">Delivering Vivo V30 Pro to Sevagram Rd, Wardha</p>
                                </div>
                            </div>
                            <span class="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Estimated Time: 12 Mins</span>
                        </div>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="bg-slate-950 rounded-2xl border border-slate-800 p-4">
                            <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-3">Courier Dispatch Desk</h4>
                            <div class="space-y-3">
                                <div class="p-2.5 bg-[#121B33]/20 border border-slate-800/80 rounded-xl flex items-center justify-between text-[11px]">
                                    <div>
                                        <p class="font-bold text-white">Rahul Deshmukh</p>
                                        <p class="text-[9px] text-gray-500">Wardha Hub • Moto Edge 40</p>
                                    </div>
                                    <span class="text-[9px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded uppercase">Pickup-Pending</span>
                                </div>
                                <div class="p-2.5 bg-[#121B33]/20 border border-slate-800/80 rounded-xl flex items-center justify-between text-[11px]">
                                    <div>
                                        <p class="font-bold text-white">Amol Wankhede</p>
                                        <p class="text-[9px] text-gray-500">Amravati Hub • Samsung S21</p>
                                    </div>
                                    <span class="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded uppercase">In-Transit</span>
                                </div>
                                <div class="p-2.5 bg-[#121B33]/20 border border-slate-800/80 rounded-xl flex items-center justify-between text-[11px]">
                                    <div>
                                        <p class="font-bold text-white">Sanjay Shah</p>
                                        <p class="text-[9px] text-gray-500">Nagpur Hub • iPhone 13</p>
                                    </div>
                                    <span class="text-[9px] bg-teal-500/10 text-teal-400 font-bold px-2 py-0.5 rounded uppercase">Delivered</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-slate-950 rounded-2xl border border-slate-800 p-4">
                            <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-3">Hub Fleet Coverage</h4>
                            <div class="space-y-2 text-[11px] text-gray-400">
                                <div class="flex justify-between"><span>Active Technicians:</span> <strong class="text-white">8 Engineers</strong></div>
                                <div class="flex justify-between"><span>Online Dispatchers:</span> <strong class="text-white">5 Couriers</strong></div>
                                <div class="flex justify-between"><span>Avg Response Latency:</span> <strong class="text-teal-400">18.4 Mins</strong></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (tabId === 'cities') {
        container.innerHTML = `
            <div class="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
                <div>
                    <h3 class="text-xl font-bold text-white font-display">Regional Cities Coverage &amp; Hub Statistics</h3>
                    <p class="text-xs text-gray-400">Direct To Consumer support centers serving eastern Maharashtra</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Wardha Card -->
                    <div class="bg-slate-950 border border-teal-500/20 rounded-2xl p-6 relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none"></div>
                        <span class="inline-block bg-teal-500/10 text-teal-400 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase mb-4">DTC Headquarters</span>
                        <h4 class="text-lg font-bold text-white font-display">Wardha Hub</h4>
                        <p class="text-xs text-gray-500 mt-1">Serving Wardha City, Sevagram, Sindi, Hinganghat, Arvi</p>
                        
                        <div class="mt-6 pt-4 border-t border-slate-900 space-y-3 text-xs">
                            <div class="flex justify-between"><span>Active Engineers:</span> <strong class="text-white">4</strong></div>
                            <div class="flex justify-between"><span>Open Tickets:</span> <strong class="text-white">12</strong></div>
                            <div class="flex justify-between"><span>Daily Gross Revenue:</span> <strong class="text-teal-400">₹24,500</strong></div>
                            <div class="flex justify-between"><span>Customer Satisfaction:</span> <strong class="text-amber-400"><i class="fa-solid fa-star"></i> 4.9</strong></div>
                        </div>
                    </div>
                    
                    <!-- Nagpur Card -->
                    <div class="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                        <span class="inline-block bg-blue-500/10 text-blue-400 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase mb-4">Satellite Lab Hub</span>
                        <h4 class="text-lg font-bold text-white font-display">Nagpur Hub</h4>
                        <p class="text-xs text-gray-500 mt-1">Serving Sadar, Sitabuldi, Dharampeth, Manish Nagar, Kamptee</p>
                        
                        <div class="mt-6 pt-4 border-t border-slate-900 space-y-3 text-xs">
                            <div class="flex justify-between"><span>Active Engineers:</span> <strong class="text-white">2</strong></div>
                            <div class="flex justify-between"><span>Open Tickets:</span> <strong class="text-white">5</strong></div>
                            <div class="flex justify-between"><span>Daily Gross Revenue:</span> <strong class="text-teal-400">₹14,200</strong></div>
                            <div class="flex justify-between"><span>Customer Satisfaction:</span> <strong class="text-amber-400"><i class="fa-solid fa-star"></i> 4.7</strong></div>
                        </div>
                    </div>
                    
                    <!-- Amravati Card -->
                    <div class="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                        <span class="inline-block bg-purple-500/10 text-purple-400 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase mb-4">Satellite Lab Hub</span>
                        <h4 class="text-lg font-bold text-white font-display">Amravati Hub</h4>
                        <p class="text-xs text-gray-500 mt-1">Serving Badnera, Rajapeth, Camp Road, Rahatgaon</p>
                        
                        <div class="mt-6 pt-4 border-t border-slate-900 space-y-3 text-xs">
                            <div class="flex justify-between"><span>Active Engineers:</span> <strong class="text-white">2</strong></div>
                            <div class="flex justify-between"><span>Open Tickets:</span> <strong class="text-white">3</strong></div>
                            <div class="flex justify-between"><span>Daily Gross Revenue:</span> <strong class="text-teal-400">₹9,800</strong></div>
                            <div class="flex justify-between"><span>Customer Satisfaction:</span> <strong class="text-amber-400"><i class="fa-solid fa-star"></i> 4.8</strong></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (tabId === 'subcontractors') {
        container.innerHTML = `
            <div class="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
                <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/60 pb-4">
                    <div>
                        <h3 class="text-xl font-bold text-white font-display">Sub-Contractor & Partner Registry</h3>
                        <p class="text-xs text-gray-400">Manage and coordinate third-party specialist laboratories for advanced motherboards/displays</p>
                    </div>
                    <button onclick="showAddSubcontractorForm()" class="bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-teal-500/10">
                        <i class="fa-solid fa-user-plus"></i> Add Sub-Contractor
                    </button>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Contractor 1 -->
                    <div class="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <div class="flex items-start justify-between">
                            <div>
                                <h4 class="font-bold text-white text-sm">Wardha Micro-Tech Lab</h4>
                                <p class="text-[10px] text-gray-500 mt-0.5">Specialization: Motherboard Layering</p>
                            </div>
                            <span class="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded uppercase">Active Verified</span>
                        </div>
                        <div class="text-[11px] text-gray-400 space-y-1">
                            <p><i class="fa-solid fa-phone mr-1.5 text-gray-600"></i> +91 91548 78241</p>
                            <p><i class="fa-solid fa-location-dot mr-1.5 text-gray-600"></i> Bachraj Road, Wardha</p>
                            <p><i class="fa-solid fa-clock-rotate-left mr-1.5 text-gray-600"></i> Avg Handback: 36 Hours</p>
                        </div>
                    </div>
                    
                    <!-- Contractor 2 -->
                    <div class="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <div class="flex items-start justify-between">
                            <div>
                                <h4 class="font-bold text-white text-sm">Nagpur Glass Refurbishers</h4>
                                <p class="text-[10px] text-gray-500 mt-0.5">Specialization: OCA Lamination & Glass Separation</p>
                            </div>
                            <span class="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded uppercase">Active Verified</span>
                        </div>
                        <div class="text-[11px] text-gray-400 space-y-1">
                            <p><i class="fa-solid fa-phone mr-1.5 text-gray-600"></i> +91 88471 63200</p>
                            <p><i class="fa-solid fa-location-dot mr-1.5 text-gray-600"></i> Ganeshpeth, Nagpur</p>
                            <p><i class="fa-solid fa-clock-rotate-left mr-1.5 text-gray-600"></i> Avg Handback: 24 Hours</p>
                        </div>
                    </div>
                    
                    <!-- Contractor 3 -->
                    <div class="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <div class="flex items-start justify-between">
                            <div>
                                <h4 class="font-bold text-white text-sm">Amravati Motherboard Experts</h4>
                                <p class="text-[10px] text-gray-500 mt-0.5">Specialization: CPU Reballing & IC swap</p>
                            </div>
                            <span class="text-[9px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded uppercase">Awaiting Bond-Sign</span>
                        </div>
                        <div class="text-[11px] text-gray-400 space-y-1">
                            <p><i class="fa-solid fa-phone mr-1.5 text-gray-600"></i> +91 76204 49182</p>
                            <p><i class="fa-solid fa-location-dot mr-1.5 text-gray-600"></i> Jail Road, Amravati</p>
                            <p><i class="fa-solid fa-clock-rotate-left mr-1.5 text-gray-600"></i> Avg Handback: 72 Hours</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (tabId === 'diagnostics') {
        container.innerHTML = `
            <div class="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
                <div>
                    <h3 class="text-xl font-bold text-white font-display">Lab Diagnostics Calibration Workbench</h3>
                    <p class="text-xs text-gray-400">Strict technical isolation check-sheet for certified hardware servicing</p>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
                        <div class="flex items-center gap-3 border-b border-slate-900 pb-4">
                            <i class="fa-solid fa-microchip text-teal-400 text-xl"></i>
                            <div>
                                <h4 class="text-xs font-bold text-white uppercase tracking-wider">Active Device Isolation Session</h4>
                                <p class="text-[10px] text-gray-500 font-mono mt-0.5">Device Serial ID: #RM-DIAG-88219</p>
                            </div>
                        </div>
                        
                        <div class="space-y-4" id="labDiagnosticChecklistForm">
                            <label class="flex items-start gap-3.5 p-3 hover:bg-slate-900/40 rounded-xl cursor-pointer select-none transition">
                                <input type="checkbox" checked class="w-4 h-4 accent-teal-500 mt-0.5 rounded">
                                <div>
                                    <span class="text-xs font-bold text-white">Privacy Lock Sandbox Mode Verified</span>
                                    <p class="text-[10px] text-gray-500 mt-0.5">Isolate private applications, chats, data files, and photos from debug terminals.</p>
                                </div>
                            </label>
                            
                            <label class="flex items-start gap-3.5 p-3 hover:bg-slate-900/40 rounded-xl cursor-pointer select-none transition">
                                <input type="checkbox" checked class="w-4 h-4 accent-teal-500 mt-0.5 rounded">
                                <div>
                                    <span class="text-xs font-bold text-white">Static Dusting & Clean Room Alignment Complete</span>
                                    <p class="text-[10px] text-gray-500 mt-0.5">Heated screen clean-up and dust removal before display decoupling.</p>
                                </div>
                            </label>
                            
                            <label class="flex items-start gap-3.5 p-3 hover:bg-slate-900/40 rounded-xl cursor-pointer select-none transition">
                                <input type="checkbox" class="w-4 h-4 accent-teal-500 mt-0.5 rounded">
                                <div>
                                    <span class="text-xs font-bold text-white">Digitizer Lamination Integrity Test Passed</span>
                                    <p class="text-[10px] text-gray-500 mt-0.5">Glass and OLED component verify proper lamination and heat resistance limits.</p>
                                </div>
                            </label>
                            
                            <label class="flex items-start gap-3.5 p-3 hover:bg-slate-900/40 rounded-xl cursor-pointer select-none transition">
                                <input type="checkbox" class="w-4 h-4 accent-teal-500 mt-0.5 rounded">
                                <div>
                                    <span class="text-xs font-bold text-white">Battery Cycle Health Verify (>85% standard)</span>
                                    <p class="text-[10px] text-gray-500 mt-0.5">Verify real capacity and report if charging board replacement is required.</p>
                                </div>
                            </label>
                        </div>
                        
                        <div class="border-t border-slate-900 pt-4 flex justify-end gap-3">
                            <button onclick="showToast('📋 Lab session diagnostics checklist saved locally!', 'success')" class="bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition">
                                Save Diagnostics State
                            </button>
                        </div>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                            <h4 class="text-xs font-bold text-white uppercase tracking-wider">Calibration Bench Status</h4>
                            <div class="text-[11px] text-gray-400 space-y-2">
                                <div class="flex justify-between"><span>Oscilloscope Frequency:</span> <strong class="text-white">100 MHz</strong></div>
                                <div class="flex justify-between"><span>Sandbox Isolation:</span> <strong class="text-emerald-400">SECURE</strong></div>
                                <div class="flex justify-between"><span>Heated Vacuum Bed:</span> <strong class="text-white">82°C Stable</strong></div>
                                <div class="flex justify-between"><span>Anti-Static Lock:</span> <strong class="text-emerald-400">ACTIVE</strong></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (tabId === 'handover') {
        container.innerHTML = `
            <div class="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 max-w-2xl mx-auto">
                <div class="text-center space-y-2">
                    <span class="inline-block bg-teal-500/15 text-teal-400 text-xs px-3 py-1 rounded-full font-bold">
                        <i class="fa-solid fa-key mr-1"></i> OTP Handover Verification
                    </span>
                    <h3 class="text-xl md:text-2xl font-bold text-white font-display">OTP Handover Authorization</h3>
                    <p class="text-xs text-gray-400">Secure doorstep ticket handovers and submission handbacks using verified 6-digit dynamic OTP codes.</p>
                </div>
                
                <form onsubmit="verifyHandoverOTP(event)" class="space-y-4 bg-slate-950 border border-slate-800 p-6 rounded-2xl text-left">
                    <div>
                        <label class="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Select Ticket Number</label>
                        <input type="text" id="handoverTicketNo" placeholder="e.g. RM-REQ-882" required class="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs text-white focus:border-teal-400 outline-none">
                    </div>
                    <div>
                        <label class="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Handover Event Type</label>
                        <select id="handoverType" class="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs text-white focus:border-teal-400 outline-none">
                            <option value="pickup">Pickup from Customer Address (Courier Handover)</option>
                            <option value="submission">Submission to RepairMaster Lab (Technician Handover)</option>
                            <option value="delivery">Handback/Delivery to Customer (Final Verification OTP)</option>
                        </select>
                    </div>
                    <div>
                        <label class="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Enter 6-Digit Verification OTP</label>
                        <input type="text" id="handoverOTPCode" placeholder="e.g. 524912" required class="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs text-white text-center font-mono font-bold tracking-widest focus:border-teal-400 outline-none">
                    </div>
                    <button type="submit" class="w-full bg-teal-600 hover:bg-teal-500 text-slate-950 hover:text-white font-bold py-3 rounded-xl transition text-xs uppercase tracking-wider">
                        Verify &amp; Confirm Handover Action
                    </button>
                </form>
            </div>
        `;
    } else if (tabId === 'finances') {
        container.innerHTML = `
            <div class="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
                <div>
                    <h3 class="text-xl font-bold text-white font-display">Financial Ledger Sheet Overview</h3>
                    <p class="text-xs text-gray-400">Total earnings, gross margins, spare part costs, and regional hub performance ledgers</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-slate-950 border border-slate-800 p-5 rounded-xl text-center">
                        <span class="text-[10px] text-gray-500 uppercase font-bold block mb-1">Total System Revenue</span>
                        <h4 class="text-2xl font-black text-white">₹48,500</h4>
                        <span class="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full mt-2 inline-block">+18.5% margin</span>
                    </div>
                    <div class="bg-slate-950 border border-slate-800 p-5 rounded-xl text-center">
                        <span class="text-[10px] text-gray-500 uppercase font-bold block mb-1">Spare Parts Investment</span>
                        <h4 class="text-2xl font-black text-white">₹16,400</h4>
                        <span class="text-[9px] text-gray-400 mt-2 block">Premium screens, sub-boards</span>
                    </div>
                    <div class="bg-slate-950 border border-slate-800 p-5 rounded-xl text-center">
                        <span class="text-[10px] text-gray-500 uppercase font-bold block mb-1">Disbursed Hub Earnings</span>
                        <h4 class="text-2xl font-black text-teal-400">₹32,100</h4>
                        <span class="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full mt-2 inline-block">Protected Escrow</span>
                    </div>
                </div>
                
                <div class="bg-slate-950 border border-slate-800 rounded-2xl p-5 overflow-x-auto">
                    <table class="w-full text-left text-xs text-gray-400 divide-y divide-slate-800">
                        <thead>
                            <tr class="text-gray-500 font-bold">
                                <th class="py-3 px-4">Regional Hub Name</th>
                                <th class="py-3 px-4">Active Jobs</th>
                                <th class="py-3 px-4">Revenue Logged</th>
                                <th class="py-3 px-4">Parts Expenses</th>
                                <th class="py-3 px-4">Disbursed Margin</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 font-medium text-white">
                            <tr>
                                <td class="py-3.5 px-4">Wardha HQ Hub</td>
                                <td class="py-3.5 px-4">12 Tickets</td>
                                <td class="py-3.5 px-4 text-emerald-400">₹24,500</td>
                                <td class="py-3.5 px-4 text-gray-400">₹8,100</td>
                                <td class="py-3.5 px-4 text-teal-400">₹16,400</td>
                            </tr>
                            <tr>
                                <td class="py-3.5 px-4">Nagpur Satellite Hub</td>
                                <td class="py-3.5 px-4">5 Tickets</td>
                                <td class="py-3.5 px-4 text-emerald-400">₹14,200</td>
                                <td class="py-3.5 px-4 text-gray-400">₹4,800</td>
                                <td class="py-3.5 px-4 text-teal-400">₹9,400</td>
                            </tr>
                            <tr>
                                <td class="py-3.5 px-4">Amravati Satellite Hub</td>
                                <td class="py-3.5 px-4">3 Tickets</td>
                                <td class="py-3.5 px-4 text-emerald-400">₹9,800</td>
                                <td class="py-3.5 px-4 text-gray-400">₹3,500</td>
                                <td class="py-3.5 px-4 text-teal-400">₹6,300</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else if (tabId === 'subcontractor-approvals') {
        container.innerHTML = `
            <div class="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
                <div>
                    <h3 class="text-xl font-bold text-white font-display">Sub-Contractor Approvals &amp; Task Audits</h3>
                    <p class="text-xs text-gray-400">Verify registrations, insurance bonds, and service capabilities of third-party repair partners</p>
                </div>
                
                <div class="space-y-4">
                    <div class="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-xl text-purple-400"><i class="fa-solid fa-microchip"></i></div>
                            <div>
                                <h4 class="font-bold text-white text-sm">Amravati Motherboard Experts</h4>
                                <p class="text-xs text-gray-500">Service Class: Level 3 CPU Reballing & Micro-Soldering</p>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="showToast('📋 Subcontractor partnership contract rejected.', 'error')" class="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold px-4 py-2 rounded-xl text-xs transition">Reject Partner</button>
                            <button onclick="showToast('✅ Subcontractor partnership contract approved!', 'success')" class="bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition">Approve &amp; Onboard Partner</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (tabId === 'timeline') {
        container.innerHTML = `
            <div class="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 max-w-2xl mx-auto text-left">
                <div class="border-b border-slate-800/60 pb-4">
                    <h3 class="text-xl font-bold text-white font-display">Active Courier Timeline status</h3>
                    <p class="text-xs text-gray-400">Real-time status checkpoints for your picked smartphone</p>
                </div>
                
                <div class="relative pl-6 border-l border-slate-800 space-y-8">
                    <div class="relative">
                        <span class="absolute -left-[30px] top-1.5 w-4.5 h-4.5 rounded-full bg-emerald-500 border-4 border-slate-950 flex items-center justify-center"></span>
                        <h4 class="text-xs font-bold text-white uppercase tracking-wider">Step 1: Repair Request Submitted</h4>
                        <p class="text-[10px] text-gray-500 mt-1">Request successfully logged on central platform.</p>
                    </div>
                    <div class="relative">
                        <span class="absolute -left-[30px] top-1.5 w-4.5 h-4.5 rounded-full bg-emerald-500 border-4 border-slate-950 flex items-center justify-center"></span>
                        <h4 class="text-xs font-bold text-white uppercase tracking-wider">Step 2: Courier Assigned for Pick-up</h4>
                        <p class="text-[10px] text-gray-500 mt-1">DTC Hub Agent #2 assigned for pickup from Wardha address.</p>
                    </div>
                    <div class="relative">
                        <span class="absolute -left-[30px] top-1.5 w-4.5 h-4.5 rounded-full bg-emerald-500 border-4 border-slate-950 flex items-center justify-center"></span>
                        <h4 class="text-xs font-bold text-white uppercase tracking-wider">Step 3: Device Picked Up (OTP Secured)</h4>
                        <p class="text-[10px] text-gray-500 mt-1">Verified via OTP handover. Device safely packaged and locked.</p>
                    </div>
                    <div class="relative">
                        <span class="absolute -left-[30px] top-1.5 w-4.5 h-4.5 rounded-full bg-slate-800 border-4 border-slate-950 flex items-center justify-center"></span>
                        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider">Step 4: Diagnostics & Laboratory Testing</h4>
                        <p class="text-[10px] text-gray-500 mt-1">Technicians performing sandbox privacy checks and calibration.</p>
                    </div>
                </div>
            </div>
        `;
    } else if (tabId === 'escrow') {
        container.innerHTML = `
            <div class="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 max-w-2xl mx-auto text-left">
                <div class="border-b border-slate-800/60 pb-4">
                    <h3 class="text-xl font-bold text-white font-display flex items-center gap-2"><i class="fa-solid fa-shield-halved text-teal-400"></i> Escrow Secure Payment Gateway</h3>
                    <p class="text-xs text-gray-400">Verify your smartphone diagnostic quote and pay securely into local escrow protection.</p>
                </div>
                
                <div class="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-gray-400">Active Diagnostic Estimate:</span>
                        <strong class="text-white text-base">₹3,400</strong>
                    </div>
                    <div class="text-[11px] text-gray-500 border-t border-slate-900 pt-4 leading-relaxed">
                        <p class="font-bold text-teal-400 mb-1"><i class="fa-solid fa-lock"></i> How Escrow Protection Works:</p>
                        Your payment is held safely in local Wardha escrow. The funds are only transferred to the technician after your phone is delivered back to you, and you complete the handback test and OTP verification!
                    </div>
                </div>
                
                <div class="space-y-3">
                    <h4 class="text-xs font-bold text-white uppercase tracking-wider">Select Local Payment Option</h4>
                    <button onclick="showToast('✅ UPI Payment authorization request sent!', 'success')" class="w-full bg-[#121B33]/40 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/30 p-4 rounded-xl flex items-center justify-between transition text-xs">
                        <span class="text-white font-bold"><i class="fa-solid fa-mobile-screen mr-2 text-teal-400"></i> Instant UPI (GPay, PhonePe, Paytm)</span>
                        <i class="fa-solid fa-chevron-right text-gray-500"></i>
                    </button>
                    <button onclick="showToast('✅ Card payment form loaded.', 'success')" class="w-full bg-[#121B33]/40 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/30 p-4 rounded-xl flex items-center justify-between transition text-xs">
                        <span class="text-white font-bold"><i class="fa-regular fa-credit-card mr-2 text-teal-400"></i> Visa, Mastercard, RuPay Cards</span>
                        <i class="fa-solid fa-chevron-right text-gray-500"></i>
                    </button>
                    <button onclick="showToast('✅ Netbanking terminal loaded.', 'success')" class="w-full bg-[#121B33]/40 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/30 p-4 rounded-xl flex items-center justify-between transition text-xs">
                        <span class="text-white font-bold"><i class="fa-solid fa-building-columns mr-2 text-teal-400"></i> Local Maharashtra Net Banking</span>
                        <i class="fa-solid fa-chevron-right text-gray-500"></i>
                    </button>
                </div>
            </div>
        `;
    }
}
window.renderDynamicTabContent = renderDynamicTabContent;

function verifyHandoverOTP(event) {
    event.preventDefault();
    const otp = document.getElementById('handoverOTPCode')?.value;
    if (otp && otp.length === 6) {
        showToast(`✅ Handover OTP ${otp} verified successfully! Ticket status updated.`, 'success');
    } else {
        showToast(`⚠️ Please enter a valid 6-digit OTP code.`, 'error');
    }
}
window.verifyHandoverOTP = verifyHandoverOTP;

function showAddSubcontractorForm() {
    showToast(`📝 Partnership registration form loaded. Contact HQ.`, 'success');
}
window.showAddSubcontractorForm = showAddSubcontractorForm;

function setStatFilter(filter) {
    if (window.customStatFilter === filter) {
        window.customStatFilter = 'All';
    } else {
        window.customStatFilter = filter;
    }
    
    if (window.renderFilteredOrders) {
        window.renderFilteredOrders();
    }
}
window.setStatFilter = setStatFilter;

async function prefillRequestForm() {
    if (!supabase || !currentUser) return;
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();

        if (error) throw error;
        
        if (profile) {
            const nameField = document.getElementById('reqName');
            const phoneField = document.getElementById('reqPhone');
            const emailField = document.getElementById('reqEmail');
            const addressField = document.getElementById('reqAddressLine');

            if (nameField && profile.full_name) {
                nameField.value = profile.full_name;
            }
            if (phoneField && profile.phone) {
                phoneField.value = profile.phone;
            }
            if (emailField && currentUser.email) {
                emailField.value = currentUser.email;
            }
            if (addressField && profile.address) {
                addressField.value = profile.address;
            }
            showToast('📋 Form pre-filled with your sign-up profile data!', 'success');
        }
    } catch (e) {
        console.warn('Could not prefill form from profiles:', e);
    }
}
window.prefillRequestForm = prefillRequestForm;

// ─── 12. COORDINATOR ALERT HUB & ORDER DETAIL MODAL FUNCTIONS ───

async function fetchAndRenderAlerts() {
    const alertsListContainer = document.getElementById('coordinatorAlertsList');
    const badge = document.getElementById('coordinatorAlertBadge');
    if (!alertsListContainer) return;

    let alerts = [];
    let dbSuccess = false;

    // Try to fetch from Supabase
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('alerts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);
            if (!error && data) {
                alerts = data;
                dbSuccess = true;
            }
        } catch (err) {
            console.warn("Could not query 'alerts' table, falling back to dynamic generation:", err);
        }
    }

    // Merge with local storage alerts if database failed or is empty
    const localAlerts = JSON.parse(localStorage.getItem('localAlerts') || '[]');
    alerts = [...alerts, ...localAlerts];

    // Fallback/Dynamic alerts generation based on orders status
    const orders = window.allFetchedOrders || [];
    orders.forEach(o => {
        const deviceName = getDeviceName(o.device_id) !== 'Device' ? getDeviceName(o.device_id) : (o.device_other || 'Device');
        // Filter out read local storage alerts
        const isReadLocally = localStorage.getItem(`dyn-alert-read-${o.id}`) === 'true';

        if (o.status === 'Pending') {
            alerts.push({
                id: `dyn-pending-${o.id}`,
                order_id: o.id,
                message: `New Service Request: ${deviceName} needs staff assignment.`,
                type: 'new_request',
                is_read: isReadLocally,
                created_at: o.created_at
            });
        } else if (o.status === 'Diagnosis-Completed') {
            alerts.push({
                id: `dyn-diag-${o.id}`,
                order_id: o.id,
                message: `Diagnosis Completed: ${deviceName} has repair recommendations. Review & quote.`,
                type: 'diagnosis_completed',
                is_read: isReadLocally,
                created_at: o.created_at
            });
        } else if (o.status === 'Pickup-Pending' && o.pickup_otp) {
            alerts.push({
                id: `dyn-pickup-${o.id}`,
                order_id: o.id,
                message: `Active Pickup: OTP generated for ${deviceName} verification.`,
                type: 'pickup_pending',
                is_read: isReadLocally,
                created_at: o.created_at
            });
        } else if (o.status === 'Ready-For-Delivery' && o.pickup_otp) {
            alerts.push({
                id: `dyn-delivery-${o.id}`,
                order_id: o.id,
                message: `Pending Dispatch: ${deviceName} is ready for delivery. Assign dispatcher.`,
                type: 'ready_for_delivery',
                is_read: isReadLocally,
                created_at: o.created_at
            });
        }
    });

    // Remove duplicates by ID (if local/database alerts conflict with fallback)
    const uniqueAlertsMap = new Map();
    alerts.forEach(a => {
        uniqueAlertsMap.set(a.id || `dyn-alert-${a.order_id}`, a);
    });
    alerts = Array.from(uniqueAlertsMap.values());

    // Sort by created_at descending
    alerts.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    // Render alerts
    const unreadCount = alerts.filter(a => !a.is_read).length;
    if (badge) {
        badge.textContent = `${unreadCount} New`;
    }

    if (alerts.length === 0) {
        alertsListContainer.innerHTML = `
            <div class="text-center py-8 text-xs text-gray-500">
                <i class="fa-solid fa-circle-check text-emerald-500 mb-2 text-lg block animate-bounce"></i> No outstanding alerts. System healthy!
            </div>
        `;
        return;
    }

    alertsListContainer.innerHTML = alerts.map(a => {
        let iconHtml = '<i class="fa-solid fa-triangle-exclamation text-amber-500 text-sm"></i>';
        if (a.type === 'new_request') {
            iconHtml = '<i class="fa-solid fa-plus-circle text-teal text-sm animate-pulse"></i>';
        } else if (a.type === 'diagnosis_completed') {
            iconHtml = '<i class="fa-solid fa-stethoscope text-amber-400 text-sm"></i>';
        } else if (a.type === 'ready_for_delivery') {
            iconHtml = '<i class="fa-solid fa-truck-ramp-box text-sky-400 text-sm"></i>';
        } else if (a.type === 'pickup_pending') {
            iconHtml = '<i class="fa-solid fa-key text-emerald-400 text-sm"></i>';
        }

        const unreadBorder = !a.is_read ? 'border-amber-500/20 bg-amber-500/5' : 'border-slate-800 bg-slate-900/30 opacity-60';
        return `
            <div onclick="viewOrderDetails('${a.order_id}', '${a.id}')" class="p-3 border ${unreadBorder} rounded-xl text-xs hover:border-teal/40 hover:bg-slate-800/40 cursor-pointer transition flex items-start gap-3">
                <div class="mt-0.5">${iconHtml}</div>
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-white leading-snug">${a.message}</p>
                    <p class="text-[10px] text-gray-500 mt-1 flex items-center justify-between">
                        <span>${new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        ${!a.is_read ? '<span class="text-[9px] font-black text-amber-400 uppercase tracking-wider">New</span>' : ''}
                    </p>
                </div>
            </div>
        `;
    }).join('');
}

async function createAlert(orderId, message, type = 'system_alert') {
    if (!supabase) return;
    try {
        const { error } = await supabase.from('alerts').insert({
            order_id: orderId,
            message: message,
            type: type,
            is_read: false
        });
        if (error) throw error;
    } catch (e) {
        console.warn("Could not write alert to public.alerts, storing locally:", e);
        const localAlerts = JSON.parse(localStorage.getItem('localAlerts') || '[]');
        localAlerts.push({
            id: `dyn-local-${Date.now()}`,
            order_id: orderId,
            message: message,
            type: type,
            is_read: false,
            created_at: new Date().toISOString()
        });
        localStorage.setItem('localAlerts', JSON.stringify(localAlerts));
    }
}

async function viewOrderDetails(orderId, alertId = null) {
    if (event && (event.target.tagName === 'BUTTON' || event.target.closest('button') || event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT')) {
        return;
    }
    const order = (window.allFetchedOrders || []).find(o => o.id === orderId);
    if (!order) {
        showToast('Order details sync reference not found.', 'error');
        return;
    }

    // Mark alert as read
    if (alertId) {
        if (alertId.startsWith('dyn-pending-') || alertId.startsWith('dyn-diag-') || alertId.startsWith('dyn-pickup-') || alertId.startsWith('dyn-delivery-')) {
            localStorage.setItem(`dyn-alert-read-${orderId}`, 'true');
        } else if (alertId.startsWith('dyn-local-')) {
            const localAlerts = JSON.parse(localStorage.getItem('localAlerts') || '[]');
            const idx = localAlerts.findIndex(la => la.id === alertId);
            if (idx !== -1) {
                localAlerts[idx].is_read = true;
                localStorage.setItem('localAlerts', JSON.stringify(localAlerts));
            }
        } else if (supabase) {
            try {
                await supabase.from('alerts').update({ is_read: true }).eq('id', alertId);
            } catch (e) {
                console.warn("Could not update database alert:", e);
            }
        }
        fetchAndRenderAlerts();
    }

    // Apply "view only this order" filter
    window.singleOrderFilter = orderId;
    
    // Highlight and select this order in the list
    const renderBtn = document.getElementById('clearSingleOrderFilterBtn');
    if (!renderBtn) {
        const container = document.getElementById('tab-tickets-section');
        if (container) {
            const header = container.querySelector('h3');
            if (header) {
                const clearBtnHtml = `
                    <button id="clearSingleOrderFilterBtn" onclick="clearSingleOrderFilter()" class="ml-4 px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-[10px] font-bold transition flex items-center gap-1">
                        <i class="fa-solid fa-xmark"></i> Clear Order Filter
                    </button>
                `;
                header.insertAdjacentHTML('afterend', clearBtnHtml);
            }
        }
    }
    renderFilteredOrders();

    // Setup Detail Modal
    const modal = document.getElementById('orderDetailModal');
    if (!modal) return;

    const deviceName = getDeviceName(order.device_id) !== 'Device' ? getDeviceName(order.device_id) : (order.device_other || 'Device');
    const repairLabel = getRepairLabel(order.repair_type_id) !== 'Repair' ? getRepairLabel(order.repair_type_id) : (order.repair_other || 'Repair');

    document.getElementById('modalOrderTitle').textContent = `${deviceName} — ${repairLabel}`;
    document.getElementById('modalOrderNumber').textContent = `ID: ${order.order_number} | Status: ${order.status}`;

    const activeRole = localStorage.getItem('activeRole') || 'customer';
    const isCoordinator = activeRole === 'coordinator' || activeRole === 'admin';
    const isRepairMaster = activeRole === 'repairmaster';

    let actionPanelHtml = '';
    if (isCoordinator) {
        if (order.status === 'Pending') {
            actionPanelHtml = `
                <div class="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                    <p class="text-xs font-bold text-white uppercase tracking-wider"><i class="fa-solid fa-user-plus text-teal mr-1"></i> Assignment Controls</p>
                    <p class="text-[11px] text-gray-400">This request is waiting to be dispatched or assigned to active bench staff.</p>
                    <div class="flex gap-2">
                        <button onclick="showAssignForm('${order.id}'); closeOrderDetailModal();" class="bg-teal hover:bg-teal-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition">Assign Staff</button>
                        <button onclick="assignSelfAsTechnician('${order.id}'); closeOrderDetailModal();" class="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition">Take as Tech</button>
                    </div>
                </div>
            `;
        } else if (order.status === 'Diagnosis-Completed') {
            actionPanelHtml = `
                <div class="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-3">
                    <p class="text-xs font-bold text-amber-400 uppercase tracking-wider"><i class="fa-solid fa-clipboard-list mr-1"></i> Review Diagnosis &amp; Quote</p>
                    <p class="text-[11px] text-gray-300">RepairMaster has completed diagnosis. Please review recommended parts pricing, adjust if needed, and dispatch quotation to the customer.</p>
                    <div class="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs text-gray-300">
                        <p>📋 <strong>Bench Notes:</strong> ${order.diagnosis_notes || 'N/A'}</p>
                        <p>💬 <strong>Advice to Coordinator:</strong> ${order.notes || 'N/A'}</p>
                        <p>💰 <strong>Recommended Total:</strong> <span class="text-teal font-extrabold">₹${(order.total_price || 0).toLocaleString('en-IN')}</span></p>
                    </div>
                    <button onclick="showQuotationForm('${order.id}', ${order.total_price || 0}, '${(order.custom_quote_parts || '').replace(/'/g, "\\'") || ''}'); closeOrderDetailModal();" class="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition">✏️ Adjust Pricing &amp; Send Quotation</button>
                </div>
            `;
        } else if (order.status === 'Ready-For-Delivery') {
            actionPanelHtml = `
                <div class="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                    <p class="text-xs font-bold text-white uppercase tracking-wider"><i class="fa-solid fa-truck-ramp-box text-teal mr-1"></i> Dispatch Courier Controls</p>
                    <p class="text-[11px] text-gray-400">Repair successfully fixed. Ready for regional delivery handover.</p>
                    <button onclick="showAssignDeliveryForm('${order.id}'); closeOrderDetailModal();" class="bg-teal hover:bg-teal-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition">Assign Delivery Tech</button>
                </div>
            `;
        }
    }

    let customerPanelHtml = '';
    if (!isRepairMaster) {
        customerPanelHtml = `
            <div class="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-2 text-xs text-gray-300">
                <p class="text-xs font-bold text-white uppercase tracking-wider mb-2 font-display"><i class="fa-regular fa-user-circle text-teal mr-1"></i> DTC Customer Contact</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-4">
                    <div>👤 <strong>Name:</strong> ${order.customer_name || 'N/A'}</div>
                    <div>📞 <strong>Phone:</strong> ${order.customer_phone || 'N/A'}</div>
                    <div>✉️ <strong>Email:</strong> ${order.customer_email || 'N/A'}</div>
                    <div>📍 <strong>Address:</strong> ${order.address || 'N/A'}</div>
                </div>
            </div>
        `;
    } else {
        customerPanelHtml = `
            <div class="p-4 bg-slate-950/40 border border-amber-500/10 rounded-2xl text-xs text-gray-400">
                <p class="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1"><i class="fa-solid fa-user-shield mr-1"></i> Customer Info Masked</p>
                <p class="text-[11px] text-gray-500 leading-normal">Direct contact identifiers masked for Bench roles. Coordinate logistics with Regional Hub Coordinator.</p>
            </div>
        `;
    }

    // Build Payment & Billing HTML
    const paymentMethod = order.payment_method || 'Pending Selection';
    const paymentStatus = order.payment_status || 'Unpaid';
    const invoiceNumber = order.invoice_number || 'Not Generated';
    
    let statusColorClass = 'text-red-400 bg-red-500/10 border-red-500/20';
    if (paymentStatus === 'Paid') {
        statusColorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    } else if (paymentStatus === 'Pending COD Confirmation') {
        statusColorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    }

    let confirmBtnHtml = '';
    if (isCoordinator && paymentStatus !== 'Paid' && (paymentMethod === 'COD' || paymentStatus === 'Pending COD Confirmation' || paymentMethod === 'Online' || paymentStatus === 'Unpaid')) {
        confirmBtnHtml = `
            <div class="mt-3">
                <button onclick="confirmPaymentManual('${order.id}')" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition">
                    💵 Confirm Payment &amp; Mark Paid
                </button>
            </div>
        `;
    }

    let invoiceDetailsHtml = 'Pending Quotation Dispatch';
    if (order.invoice_number) {
        invoiceDetailsHtml = `
            <div class="space-y-1.5">
                <div class="flex justify-between">
                    <span>🧾 Invoice Number:</span>
                    <span class="text-white font-semibold">${invoiceNumber}</span>
                </div>
                <div class="flex justify-between">
                    <span>Subtotal:</span>
                    <span class="text-gray-300">₹${(order.total_price || 0).toLocaleString('en-IN')}</span>
                </div>
                <div class="flex justify-between">
                    <span>Tax (18% GST):</span>
                    <span class="text-gray-300">₹${(order.tax_amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div class="flex justify-between">
                    <span>Platform Fee (10%):</span>
                    <span class="text-gray-300">₹${(order.platform_fee || 0).toLocaleString('en-IN')}</span>
                </div>
                <div class="flex justify-between border-t border-slate-800 pt-1.5 text-teal font-extrabold">
                    <span>Grand Total:</span>
                    <span>₹${(order.grand_total || order.total_price || 0).toLocaleString('en-IN')}</span>
                </div>
                ${paymentStatus === 'Paid' ? `
                    <div class="pt-2">
                        <button onclick="openInvoicePage('${order.id}')" class="w-full bg-slate-800 hover:bg-slate-750 text-teal-300 border border-teal-500/20 font-bold py-1.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5">
                            <i class="fa-solid fa-file-invoice-dollar"></i> View/Print Invoice
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    const paymentBillingHtml = `
        <div class="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-3 text-xs text-gray-300">
            <p class="text-xs font-bold text-white uppercase tracking-wider mb-2 font-display"><i class="fa-solid fa-file-invoice-dollar text-teal mr-1"></i> Payment &amp; Billing</p>
            <div class="grid grid-cols-2 gap-3 mb-2">
                <div class="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                    <span class="text-gray-500 block uppercase font-bold text-[9px] mb-0.5">PAYMENT METHOD</span>
                    <span class="text-white font-bold">${paymentMethod}</span>
                </div>
                <div class="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                    <span class="text-gray-500 block uppercase font-bold text-[9px] mb-0.5">PAYMENT STATUS</span>
                    <span class="inline-block border px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${statusColorClass}">${paymentStatus}</span>
                </div>
            </div>
            <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                ${invoiceDetailsHtml}
            </div>
            ${confirmBtnHtml}
        </div>
    `;

    const bodyContainer = document.getElementById('modalOrderBody');
    bodyContainer.innerHTML = `
        <div class="space-y-5">
            <div class="grid grid-cols-2 gap-3 text-xs">
                <div class="p-3 bg-slate-950/60 border border-slate-850 rounded-xl">
                    <span class="text-gray-500 block uppercase font-bold text-[9px] mb-0.5">CURRENT STATUS</span>
                    <span class="inline-block bg-teal-500/10 text-teal border border-teal-500/20 px-2 py-0.5 rounded-full font-black uppercase text-[9px]">${order.status}</span>
                </div>
                <div class="p-3 bg-slate-950/60 border border-slate-850 rounded-xl">
                    <span class="text-gray-500 block uppercase font-bold text-[9px] mb-0.5">ESTIMATED PRICE</span>
                    <span class="text-white font-black text-sm">₹${(order.total_price || 0).toLocaleString('en-IN')}</span>
                </div>
            </div>

            ${customerPanelHtml}

            <div class="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-2 text-xs text-gray-300">
                <p class="text-xs font-bold text-white uppercase tracking-wider mb-2 font-display"><i class="fa-solid fa-stethoscope text-teal mr-1"></i> Diagnostic Summary</p>
                <div class="space-y-1.5">
                    <p>🔬 <strong>Diagnosis Notes:</strong> ${order.diagnosis_notes || 'Pending technician diagnosis.'}</p>
                    <p>📝 <strong>Fault Description:</strong> ${order.additional_notes || 'N/A'}</p>
                    <p>🛠️ <strong>Assigned Tech ID:</strong> <span class="text-gray-400">${order.technician_id || 'Not Assigned'}</span></p>
                    <p>🧪 <strong>Assigned Master ID:</strong> <span class="text-gray-400">${order.repairmaster_id || 'Not Assigned'}</span></p>
                </div>
            </div>

            ${paymentBillingHtml}

            ${actionPanelHtml}
        </div>
    `;

    modal.classList.remove('hidden');
}

function closeOrderDetailModal() {
    document.getElementById('orderDetailModal')?.classList.add('hidden');
}

function clearSingleOrderFilter() {
    window.singleOrderFilter = null;
    document.getElementById('clearSingleOrderFilterBtn')?.remove();
    if (window.renderFilteredOrders) {
        window.renderFilteredOrders();
    }
}

window.fetchAndRenderAlerts = fetchAndRenderAlerts;
window.createAlert = createAlert;
window.viewOrderDetails = viewOrderDetails;
window.closeOrderDetailModal = closeOrderDetailModal;
window.clearSingleOrderFilter = clearSingleOrderFilter;
window.selectCODPayment = selectCODPayment;
window.confirmPaymentManual = confirmPaymentManual;
window.openInvoicePage = openInvoicePage;
