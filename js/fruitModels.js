/* ============================================
   S.L.A FRUIT SHOP - Procedural 3D Fruit Models
   Realistic shapes (LatheGeometry profiles) with
   baked canvas skin textures (gradients, blush,
   dimples, stripes, speckles). Each model is a
   THREE.Group centred at the origin.
   ============================================ */

function _phong(color, shininess, specular) {
    return new THREE.MeshPhongMaterial({
        color: color,
        shininess: shininess || 45,
        specular: specular || 0x222222
    });
}

function _rgba(hex, alpha) {
    const n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + alpha + ')';
}

// Baked skin texture: base colour + optional speckles/dimples/stripes/blush + soft shading
function _skin(base, opts) {
    opts = opts || {};
    const S = 256;
    const c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    const ctx = c.getContext('2d');

    ctx.fillStyle = base;
    ctx.fillRect(0, 0, S, S);

    if (opts.speckles) {
        for (let i = 0; i < opts.speckles; i++) {
            ctx.fillStyle = opts.speckleColor || 'rgba(0,0,0,0.06)';
            const sz = 1 + Math.random() * 1.5;
            ctx.fillRect(Math.random() * S, Math.random() * S, sz, sz);
        }
    }

    if (opts.dimples) {
        ctx.fillStyle = opts.dimpleColor || 'rgba(0,0,0,0.05)';
        const rows = opts.dimples;
        for (let r = 0; r < rows; r++) {
            const y = (r + 0.5) * S / rows;
            const off = (r % 2) * S / (rows * 2);
            for (let x = off; x < S; x += S / rows) {
                ctx.beginPath();
                ctx.arc(x, y, 1.8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    if (opts.stripes) {
        const n = opts.stripes.count || 4;
        ctx.strokeStyle = opts.stripes.color || '#1B5E20';
        ctx.lineWidth = opts.stripes.width || 26;
        ctx.lineCap = 'round';
        for (let i = 0; i < n; i++) {
            const x0 = (i + 0.5) * S / n;
            ctx.beginPath();
            ctx.moveTo(x0, -4);
            ctx.bezierCurveTo(x0 + 34, S * 0.33, x0 - 34, S * 0.66, x0, S + 4);
            ctx.stroke();
        }
    }

    if (opts.hatch) {
        ctx.strokeStyle = opts.hatch.color || 'rgba(150,110,10,0.3)';
        ctx.lineWidth = opts.hatch.width || 3;
        const step = opts.hatch.step || 32;
        for (let i = -S; i < S * 2; i += step) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + S, S);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(i + S, 0);
            ctx.lineTo(i, S);
            ctx.stroke();
        }
    }

    if (opts.blush) {
        const x = opts.blush.x !== undefined ? opts.blush.x : S * 0.72;
        const y = opts.blush.y !== undefined ? opts.blush.y : S * 0.58;
        const r = opts.blush.r || S * 0.4;
        const g = ctx.createRadialGradient(x, y, 2, x, y, r);
        g.addColorStop(0, _rgba(opts.blush.color || '#FF4D4D', opts.blush.alpha || 0.4));
        g.addColorStop(1, _rgba(opts.blush.color || '#FF4D4D', 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, S, S);
    }

    if (opts.shade !== false) {
        const grad = ctx.createLinearGradient(0, S, 0, 0);
        grad.addColorStop(0, 'rgba(0,0,0,0.30)');
        grad.addColorStop(0.5, 'rgba(0,0,0,0.05)');
        grad.addColorStop(1, 'rgba(255,255,255,0.18)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, S, S);

        const hl = ctx.createRadialGradient(S * 0.3, S * 0.26, 4, S * 0.3, S * 0.26, S * 0.82);
        hl.addColorStop(0, 'rgba(255,255,255,0.30)');
        hl.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hl;
        ctx.fillRect(0, 0, S, S);
    }

    const tex = new THREE.CanvasTexture(c);
    return tex;
}

function _latheMesh(profile, material, segments) {
    const m = new THREE.Mesh(new THREE.LatheGeometry(profile, segments || 28), material);
    return m;
}

function _bumpySphere(r, amp, freq, segments) {
    const seg = segments || 24;
    const geo = new THREE.SphereGeometry(r, seg, Math.floor(seg / 2));
    const pos = geo.attributes.position;
    const n = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
        n.fromBufferAttribute(pos, i).normalize();
        const noise = Math.sin(n.y * freq)
            * Math.cos(n.x * freq * 0.8)
            * Math.sin((n.x + n.z) * freq * 0.7);
        const d = 1 + noise * amp;
        pos.setXYZ(i, n.x * r * d, n.y * r * d, n.z * r * d);
    }
    geo.computeVertexNormals();
    return geo;
}

function _stem(group, color, y, len, r) {
    const m = new THREE.Mesh(
        new THREE.CylinderGeometry(r || 0.045, r || 0.045, len || 0.3, 8),
        _phong(color || 0x7A5A32, 18)
    );
    m.position.y = y;
    m.rotation.z = 0.12;
    group.add(m);
    return m;
}

function _leaf(group, color, x, y, z, rotY, scale) {
    const s = scale || 1;
    const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.2 * s, 12, 10),
        _phong(color || 0x2E7D32, 25, 0x112211)
    );
    m.scale.set(1.35, 0.13, 0.5);
    m.position.set(x, y, z);
    m.rotation.y = rotY || 0;
    m.rotation.z = 0.25;
    group.add(m);
    return m;
}

function _skinned(mesh, texture) {
    const mat = mesh.material;
    mat.map = texture;
    mat.color.setHex(0xffffff);
    return mesh;
}

// Shared textures (cached) to avoid re-creating on every card
const _sharedTex = {};
function _shared(key, build) {
    if (!_sharedTex[key]) _sharedTex[key] = build();
    return _sharedTex[key];
}

function normalizeFruit(name) {
    if (!name) return 'Apple';
    if (name.indexOf('Pomegranate') !== -1) return 'Pomegranate';
    return name;
}

function createFruitModel(name) {
    const n = normalizeFruit(name);
    const g = new THREE.Group();

    switch (n) {
        case 'Mango': {
            const profile = [
                new THREE.Vector2(0, -0.95),
                new THREE.Vector2(0.4, -0.78),
                new THREE.Vector2(0.58, -0.5),
                new THREE.Vector2(0.66, -0.15),
                new THREE.Vector2(0.6, 0.22),
                new THREE.Vector2(0.45, 0.5),
                new THREE.Vector2(0.26, 0.66),
                new THREE.Vector2(0.1, 0.76),
                new THREE.Vector2(0, 0.8)
            ];
            const body = _latheMesh(profile, _phong(0xffffff, 70), 32);
            _skinned(body, _skin('#FFC94D', {
                blush: { color: '#FF5A36', x: 195, y: 105, r: 95, alpha: 0.5 },
                speckles: 120
            }));
            body.scale.z = 0.92;
            g.add(body);
            const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.24, 8), _phong(0x8B5E3C, 18));
            tip.position.set(0.02, 0.88, 0);
            tip.rotation.z = 0.25;
            g.add(tip);
            _stem(g, 0x7A5A32, 0.62, 0.3, 0.05);
            _leaf(g, 0x3E8E41, 0.14, 0.8, 0.02, 0.6, 0.85);
            break;
        }
        case 'Banana': {
            const shape = new THREE.Shape();
            const N = 5;
            for (let i = 0; i < N; i++) {
                const a = -Math.PI / 2 + (i / N) * Math.PI * 2;
                const r = i % 2 === 0 ? 0.17 : 0.135;
                const x = Math.cos(a) * r;
                const y = Math.sin(a) * r;
                if (i === 0) shape.moveTo(x, y);
                else shape.lineTo(x, y);
            }
            shape.closePath();
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-0.55, -0.18, 0),
                new THREE.Vector3(-0.28, 0.22, 0),
                new THREE.Vector3(0, 0.33, 0),
                new THREE.Vector3(0.28, 0.22, 0),
                new THREE.Vector3(0.55, -0.18, 0)
            ]);
            const geo = new THREE.ExtrudeGeometry(shape, {
                extrudePath: curve,
                steps: 24,
                bevelEnabled: false
            });
            const body = new THREE.Mesh(geo, _phong(0xffffff, 55));
            _skinned(body, _skin('#FFD947', {
                blush: { color: '#C9971B', x: 128, y: 40, r: 90, alpha: 0.35 },
                speckles: 40,
                shade: false
            }));
            body.scale.set(1.25, 1, 1);
            g.add(body);
            const tipMat = _phong(0x7A5A32, 15);
            const tipA = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), tipMat);
            tipA.position.set(-0.7, -0.18, 0);
            tipA.scale.set(0.85, 0.7, 0.7);
            g.add(tipA);
            const tipB = tipA.clone();
            tipB.position.x = 0.7;
            g.add(tipB);
            break;
        }
        case 'Guava': {
            const body = new THREE.Mesh(_bumpySphere(0.68, 0.05, 5, 20), _phong(0xffffff, 35));
            _skinned(body, _skin('#A8D66B', {
                blush: { color: '#E8F3C8', x: 80, y: 130, r: 80, alpha: 0.35 },
                speckles: 80
            }));
            body.scale.set(1, 1.12, 0.92);
            g.add(body);
            _stem(g, 0x6B7B3A, 0.7, 0.26, 0.05);
            _leaf(g, 0x4C8C4A, 0.1, 0.86, 0.05, 0.5, 0.9);
            break;
        }
        case 'Papaya': {
            const profile = [
                new THREE.Vector2(0, -1.1),
                new THREE.Vector2(0.4, -0.95),
                new THREE.Vector2(0.55, -0.6),
                new THREE.Vector2(0.58, -0.2),
                new THREE.Vector2(0.5, 0.2),
                new THREE.Vector2(0.3, 0.5),
                new THREE.Vector2(0.12, 0.68),
                new THREE.Vector2(0, 0.75)
            ];
            const body = _latheMesh(profile, _phong(0xffffff, 50), 28);
            _skinned(body, _skin('#F5B900', {
                blush: { color: '#E8751A', x: 190, y: 150, r: 100, alpha: 0.4 },
                speckles: 60
            }));
            body.scale.z = 0.82;
            g.add(body);
            _stem(g, 0x7A5A32, 0.68, 0.24, 0.05);
            _leaf(g, 0x3E8E41, -0.04, 0.78, 0.03, -0.4, 0.85);
            break;
        }
        case 'Pomegranate': {
            const body = new THREE.Mesh(_bumpySphere(0.7, 0.04, 5, 24), _phong(0xffffff, 65));
            _skinned(body, _skin('#C11A3E', {
                blush: { color: '#8E0F2E', x: 170, y: 120, r: 90, alpha: 0.4 },
                speckles: 140
            }));
            body.scale.set(1, 1.06, 0.95);
            g.add(body);
            const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.26, 6), _phong(0x9C1130, 25));
            crown.position.y = 0.8;
            g.add(crown);
            _stem(g, 0x7A5A32, 0.6, 0.2, 0.045);
            break;
        }
        case 'Watermelon': {
            const body = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 24), _phong(0xffffff, 30));
            _skinned(body, _skin('#2E7D32', {
                stripes: { color: '#123D1B', count: 5, width: 30 },
                speckles: 60,
                shade: false
            }));
            body.scale.set(1, 0.95, 0.85);
            g.add(body);
            const curl = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 6), _phong(0x2E7D32, 18));
            curl.position.y = 0.72;
            curl.rotation.z = 0.5;
            g.add(curl);
            break;
        }
        case 'Coconut': {
            const body = new THREE.Mesh(_bumpySphere(0.66, 0.1, 7, 22), _phong(0xffffff, 25));
            _skinned(body, _shared('coconut', () => _skin('#8B5A2B', {
                speckles: 600,
                speckleColor: 'rgba(60,32,10,0.35)'
            })));
            body.scale.set(1, 1.08, 0.95);
            g.add(body);
            const eyeMat = _phong(0x4E2E12, 10);
            for (let i = 0; i < 3; i++) {
                const a = (i / 3) * Math.PI * 2 + 0.6;
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), eyeMat);
                eye.position.set(Math.cos(a) * 0.2, 0.74, Math.sin(a) * 0.2);
                g.add(eye);
            }
            const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 6), _phong(0x6B4A2B, 15));
            tuft.position.y = 0.8;
            g.add(tuft);
            break;
        }
        case 'Jackfruit': {
            const body = new THREE.Mesh(_bumpySphere(0.7, 0.36, 8, 24), _phong(0xffffff, 20));
            _skinned(body, _skin('#9ACD32', {
                blush: { color: '#C9D94B', x: 90, y: 90, r: 110, alpha: 0.3 },
                speckles: 200,
                speckleColor: 'rgba(60,80,10,0.2)'
            }));
            body.scale.set(1.1, 1.25, 0.9);
            g.add(body);
            _stem(g, 0x6B4A2B, 0.85, 0.26, 0.06);
            break;
        }
        case 'Lychee': {
            const body = new THREE.Mesh(_bumpySphere(0.5, 0.22, 10, 22), _phong(0xffffff, 45));
            _skinned(body, _skin('#E85D75', {
                blush: { color: '#C2415C', x: 180, y: 90, r: 70, alpha: 0.35 },
                speckles: 220,
                speckleColor: 'rgba(120,30,50,0.2)'
            }));
            body.scale.set(1, 0.95, 0.92);
            g.add(body);
            _stem(g, 0x8B5E3C, 0.5, 0.22, 0.035);
            break;
        }
        case 'Jamun': {
            const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 20), _phong(0xffffff, 55));
            _skinned(body, _skin('#5B1E66', {
                blush: { color: '#3D0F4A', x: 160, y: 70, r: 60, alpha: 0.4 },
                speckles: 80
            }));
            body.scale.set(1, 1.45, 0.92);
            g.add(body);
            const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.08, 6), _phong(0x3A0066, 25));
            cap.position.y = 0.62;
            g.add(cap);
            break;
        }
        case 'Amla': {
            const body = new THREE.Mesh(_bumpySphere(0.55, 0.08, 7, 20), _phong(0xffffff, 40));
            _skinned(body, _skin('#A8D838', {
                blush: { color: '#D9F29B', x: 85, y: 100, r: 75, alpha: 0.3 },
                speckles: 100
            }));
            body.scale.set(1, 0.92, 0.95);
            g.add(body);
            const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 0.16, 6), _phong(0x7FA81F, 25));
            crown.position.y = 0.54;
            g.add(crown);
            break;
        }
        case 'Chikoo': {
            const body = new THREE.Mesh(_bumpySphere(0.6, 0.13, 7, 22), _phong(0xffffff, 20));
            _skinned(body, _shared('chikoo', () => _skin('#9C6B3A', {
                speckles: 500,
                speckleColor: 'rgba(70,45,15,0.3)'
            })));
            body.scale.set(1, 1.3, 0.85);
            g.add(body);
            _stem(g, 0x6B4A2B, 0.74, 0.2, 0.045);
            break;
        }
        case 'Sitaphal': {
            const body = new THREE.Mesh(_bumpySphere(0.62, 0.14, 6, 22), _phong(0xffffff, 30));
            _skinned(body, _skin('#8BC34A', {
                blush: { color: '#AED581', x: 90, y: 120, r: 90, alpha: 0.3 },
                speckles: 160
            }));
            body.scale.set(1, 1.05, 0.95);
            g.add(body);
            _stem(g, 0x6B7B3A, 0.62, 0.2, 0.045);
            break;
        }
        case 'Mosambi': {
            const body = new THREE.Mesh(_bumpySphere(0.62, 0.05, 5, 22), _phong(0xffffff, 45));
            _skinned(body, _skin('#8FC93C', {
                dimples: 9,
                blush: { color: '#C8E64B', x: 85, y: 100, r: 80, alpha: 0.3 },
                speckles: 60
            }));
            g.add(body);
            _stem(g, 0x6B7B3A, 0.62, 0.2, 0.04);
            _leaf(g, 0x4C8C4A, 0.08, 0.74, 0.05, 0.6, 0.7);
            break;
        }
        case 'Ber': {
            const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), _phong(0xffffff, 50));
            _skinned(body, _skin('#C0592F', {
                blush: { color: '#8E3D1A', x: 160, y: 80, r: 55, alpha: 0.35 },
                speckles: 60
            }));
            g.add(body);
            _stem(g, 0x7A5A32, 0.42, 0.16, 0.035);
            break;
        }
        case 'Bael': {
            const body = new THREE.Mesh(_bumpySphere(0.62, 0.1, 6, 20), _phong(0xffffff, 20));
            _skinned(body, _shared('bael', () => _skin('#C8A96A', {
                speckles: 350,
                speckleColor: 'rgba(90,70,35,0.3)'
            })));
            g.add(body);
            _stem(g, 0x6B4A2B, 0.62, 0.2, 0.05);
            break;
        }
        case 'Kamrakh': {
            const star = new THREE.Shape();
            for (let i = 0; i < 10; i++) {
                const r = i % 2 === 0 ? 0.85 : 0.38;
                const a = (i * Math.PI) / 5 - Math.PI / 2;
                if (i === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                else star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            star.closePath();
            const body = new THREE.Mesh(
                new THREE.ExtrudeGeometry(star, { depth: 0.24, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 }),
                _phong(0xffffff, 55)
            );
            _skinned(body, _skin('#F5C518', {
                blush: { color: '#D9A500', x: 60, y: 90, r: 90, alpha: 0.3 },
                speckles: 60,
                shade: false
            }));
            g.add(body);
            const cap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), _phong(0x8B6914, 18));
            cap.position.set(0, 0.18, 0.02);
            g.add(cap);
            break;
        }
        case 'Kokum': {
            const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 20), _phong(0xffffff, 45));
            _skinned(body, _skin('#7B1E5C', {
                blush: { color: '#5B1445', x: 160, y: 80, r: 70, alpha: 0.4 },
                speckles: 120
            }));
            body.scale.set(1, 0.85, 0.92);
            g.add(body);
            _stem(g, 0x6B4A2B, 0.46, 0.16, 0.04);
            break;
        }
        case 'Apple': {
            const profile = [
                new THREE.Vector2(0, -0.9),
                new THREE.Vector2(0.55, -0.78),
                new THREE.Vector2(0.78, -0.52),
                new THREE.Vector2(0.92, -0.2),
                new THREE.Vector2(0.88, 0.08),
                new THREE.Vector2(0.76, 0.32),
                new THREE.Vector2(0.55, 0.5),
                new THREE.Vector2(0.3, 0.58),
                new THREE.Vector2(0.08, 0.68),
                new THREE.Vector2(0, 0.72)
            ];
            const body = _latheMesh(profile, _phong(0xffffff, 75), 32);
            _skinned(body, _skin('#E33B2C', {
                blush: { color: '#FF7A4D', x: 175, y: 150, r: 100, alpha: 0.45 },
                blush2: true,
                speckles: 70
            }));
            g.add(body);
            _stem(g, 0x5B3A1E, 0.62, 0.3, 0.05);
            _leaf(g, 0x2E7D32, 0.12, 0.8, 0, 0.7, 1);
            break;
        }
        case 'Orange': {
            const body = new THREE.Mesh(_bumpySphere(0.66, 0.03, 5, 24), _phong(0xffffff, 55));
            _skinned(body, _skin('#FF9E1B', {
                dimples: 11,
                blush: { color: '#FF6A00', x: 175, y: 130, r: 90, alpha: 0.35 },
                speckles: 50
            }));
            g.add(body);
            _stem(g, 0x6B7B3A, 0.64, 0.18, 0.04);
            _leaf(g, 0x3E8E41, 0.1, 0.74, 0.05, 0.8, 0.8);
            break;
        }
        case 'Grapes': {
            const grapeTex = _shared('grape', () => _skin('#8BC34A', {
                blush: { color: '#D6F5B8', x: 70, y: 75, r: 55, alpha: 0.55 },
                speckles: 30,
                shade: false
            }));
            const grapeMat = _phong(0xffffff, 70);
            grapeMat.map = grapeTex;
            grapeMat.color.setHex(0xffffff);
            const gball = (x, y, z, s) => {
                const m = new THREE.Mesh(new THREE.SphereGeometry(0.16 * s, 12, 12), grapeMat);
                m.position.set(x, y, z);
                g.add(m);
            };
            gball(0, -0.58, 0, 1.05);
            gball(-0.18, -0.42, 0.05, 1);
            gball(0.18, -0.42, 0.05, 1);
            gball(-0.1, -0.28, -0.1, 0.95);
            gball(0.1, -0.28, 0.02, 0.95);
            gball(0, -0.14, 0.06, 0.9);
            gball(-0.17, -0.1, -0.05, 0.88);
            gball(0.17, -0.1, -0.05, 0.88);
            gball(0, 0.04, 0, 0.82);
            gball(-0.09, 0.18, 0.02, 0.78);
            gball(0.09, 0.18, 0.02, 0.78);
            gball(0, 0.3, 0, 0.72);
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.24, 8), _phong(0x8B5E3C, 18));
            stem.position.y = 0.46;
            g.add(stem);
            _leaf(g, 0x3E8E41, 0.1, 0.56, 0, 0.5, 0.8);
            break;
        }
        case 'Kiwi': {
            const body = new THREE.Mesh(_bumpySphere(0.62, 0.06, 6, 22), _phong(0xffffff, 20));
            _skinned(body, _shared('kiwi', () => _skin('#9C6B35', {
                speckles: 450,
                speckleColor: 'rgba(60,35,10,0.35)'
            })));
            body.scale.set(1, 1.25, 0.95);
            g.add(body);
            _stem(g, 0x6B4A2B, 0.74, 0.16, 0.04);
            break;
        }
        case 'Dragon Fruit': {
            const body = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 24), _phong(0xffffff, 55));
            _skinned(body, _skin('#FF6FA5', {
                blush: { color: '#F44A8B', x: 190, y: 110, r: 90, alpha: 0.4 },
                speckles: 40
            }));
            body.scale.set(1, 1.3, 0.85);
            g.add(body);
            const flapMat = _phong(0x9BE08A, 25, 0x112211);
            const up = new THREE.Vector3(0, 1, 0);
            const tmpQuat = new THREE.Quaternion();
            const tmpDir = new THREE.Vector3();
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                [-0.55, 0, 0.55].forEach(row => {
                    const flap = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), flapMat);
                    flap.scale.set(0.4, 1.7, 0.5);
                    const y = row * 0.9;
                    flap.position.set(Math.cos(a) * 0.78, y, Math.sin(a) * 0.78);
                    tmpDir.set(Math.cos(a), y * 0.4, Math.sin(a)).normalize();
                    tmpQuat.setFromUnitVectors(up, tmpDir);
                    flap.quaternion.copy(tmpQuat);
                    g.add(flap);
                });
            }
            break;
        }
        case 'Avocado': {
            const profile = [
                new THREE.Vector2(0, -1.0),
                new THREE.Vector2(0.48, -0.92),
                new THREE.Vector2(0.72, -0.6),
                new THREE.Vector2(0.68, -0.28),
                new THREE.Vector2(0.52, -0.02),
                new THREE.Vector2(0.3, 0.3),
                new THREE.Vector2(0.18, 0.55),
                new THREE.Vector2(0, 0.7)
            ];
            const body = _latheMesh(profile, _phong(0xffffff, 40), 28);
            _skinned(body, _skin('#2F6B2F', {
                blush: { color: '#1F4B22', x: 180, y: 90, r: 90, alpha: 0.4 },
                speckles: 140
            }));
            g.add(body);
            _stem(g, 0x6B4A2B, 0.66, 0.2, 0.045);
            _leaf(g, 0x3E8E41, 0.1, 0.74, 0, 0.6, 0.7);
            break;
        }
        case 'Blueberry': {
            const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 22, 18), _phong(0xffffff, 80));
            _skinned(body, _skin('#3D53A8', {
                blush: { color: '#2B3A8F', x: 160, y: 70, r: 60, alpha: 0.4 },
                speckles: 40
            }));
            g.add(body);
            const crownMat = _phong(0x3D2B8F, 40);
            for (let i = 0; i < 5; i++) {
                const a = (i / 5) * Math.PI * 2;
                const c = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 5), crownMat);
                c.position.set(Math.cos(a) * 0.1, 0.4, Math.sin(a) * 0.1);
                c.rotation.z = Math.cos(a) * 0.5;
                c.rotation.x = Math.sin(a) * 0.5;
                g.add(c);
            }
            break;
        }
        case 'Strawberry': {
            const profile = [
                new THREE.Vector2(0, -1.05),
                new THREE.Vector2(0.55, -0.95),
                new THREE.Vector2(0.8, -0.7),
                new THREE.Vector2(0.86, -0.35),
                new THREE.Vector2(0.6, 0.1),
                new THREE.Vector2(0.2, 0.34),
                new THREE.Vector2(0, 0.4)
            ];
            const body = _latheMesh(profile, _phong(0xffffff, 60), 28);
            _skinned(body, _skin('#E23B3B', {
                blush: { color: '#FF5A5A', x: 165, y: 150, r: 100, alpha: 0.35 },
                speckles: 30
            }));
            g.add(body);
            const seedMat = _phong(0xFFD54F, 25);
            for (let i = 0; i < 10; i++) {
                const a = (i / 10) * Math.PI * 2;
                [0.1, 0.32, 0.55].forEach(dy => {
                    const seed = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), seedMat);
                    const rr = 0.82 - dy * 0.55;
                    const yy = dy * 1.15 - 0.38;
                    seed.position.set(Math.cos(a) * rr, yy, Math.sin(a) * rr);
                    seed.scale.set(1, 0.7, 1);
                    g.add(seed);
                });
            }
            const leafMat = _phong(0x2E7D32, 25);
            for (let i = 0; i < 5; i++) {
                const a = (i / 5) * Math.PI * 2;
                const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), leafMat);
                leaf.scale.set(0.5, 0.12, 1.3);
                leaf.position.set(Math.cos(a) * 0.2, 0.44, Math.sin(a) * 0.2);
                leaf.rotation.y = a;
                g.add(leaf);
            }
            break;
        }
        case 'Cherry': {
            const cherryTex = _shared('cherry', () => _skin('#C0222E', {
                blush: { color: '#FF6B6B', x: 80, y: 80, r: 55, alpha: 0.5 },
                speckles: 40,
                shade: false
            }));
            const cherryMat = _phong(0xffffff, 80);
            cherryMat.map = cherryTex;
            cherryMat.color.setHex(0xffffff);
            const m1 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), cherryMat);
            m1.position.set(-0.28, -0.1, 0);
            g.add(m1);
            const m2 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), cherryMat);
            m2.position.set(0.3, -0.12, 0);
            g.add(m2);
            const stemCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-0.28, 0.2, 0),
                new THREE.Vector3(-0.05, 0.6, 0.05),
                new THREE.Vector3(0.15, 0.55, -0.03),
                new THREE.Vector3(0.3, 0.18, 0)
            ]);
            const stemGeo = new THREE.TubeGeometry(stemCurve, 12, 0.028, 6, false);
            const stem = new THREE.Mesh(stemGeo, _phong(0x5B3A1E, 18));
            g.add(stem);
            break;
        }
        case 'Pineapple': {
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.44, 0.95, 22), _phong(0xffffff, 40));
            _skinned(body, _shared('pineapple', () => {
                return _skin('#F5C518', {
                    hatch: { color: 'rgba(160,115,10,0.35)', width: 4, step: 26 },
                    blush: { color: '#FFB300', x: 90, y: 90, r: 90, alpha: 0.3 }
                });
            }));
            body.position.y = -0.1;
            g.add(body);
            const leafMat = _phong(0x2E7D32, 30);
            for (let i = 0; i < 7; i++) {
                const a = (i / 7) * Math.PI * 2;
                const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.45, 5), leafMat);
                leaf.position.set(Math.cos(a) * 0.1, 0.5, Math.sin(a) * 0.1);
                leaf.rotation.z = Math.cos(a) * 0.65;
                leaf.rotation.x = Math.sin(a) * 0.65;
                g.add(leaf);
            }
            const centerLeaf = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.55, 6), leafMat);
            centerLeaf.position.y = 0.55;
            g.add(centerLeaf);
            break;
        }
        case 'Fig': {
            const profile = [
                new THREE.Vector2(0, -1.0),
                new THREE.Vector2(0.56, -0.85),
                new THREE.Vector2(0.72, -0.5),
                new THREE.Vector2(0.56, -0.1),
                new THREE.Vector2(0.22, 0.16),
                new THREE.Vector2(0.08, 0.36),
                new THREE.Vector2(0, 0.42)
            ];
            const body = _latheMesh(profile, _phong(0xffffff, 45), 26);
            _skinned(body, _skin('#7B3F8E', {
                blush: { color: '#5B2A6E', x: 180, y: 90, r: 80, alpha: 0.4 },
                speckles: 90
            }));
            g.add(body);
            _stem(g, 0x5B3A1E, 0.38, 0.16, 0.04);
            break;
        }
        case 'Passion Fruit': {
            const body = new THREE.Mesh(_bumpySphere(0.6, 0.06, 6, 22), _phong(0xffffff, 45));
            _skinned(body, _skin('#6A2C91', {
                blush: { color: '#4E1F6E', x: 165, y: 90, r: 75, alpha: 0.4 },
                speckles: 80
            }));
            g.add(body);
            _stem(g, 0x5B3A1E, 0.58, 0.16, 0.035);
            break;
        }
        case 'Persimmon': {
            const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 28, 22), _phong(0xffffff, 55));
            _skinned(body, _skin('#FF7F00', {
                blush: { color: '#FF5500', x: 180, y: 90, r: 85, alpha: 0.4 },
                speckles: 60
            }));
            body.scale.set(1, 0.92, 1);
            g.add(body);
            const calyxMat = _phong(0x2E7D32, 25);
            for (let i = 0; i < 4; i++) {
                const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
                const lobe = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), calyxMat);
                lobe.scale.set(0.45, 0.14, 1.4);
                lobe.position.set(Math.cos(a) * 0.3, 0.55, Math.sin(a) * 0.3);
                lobe.rotation.y = a;
                g.add(lobe);
            }
            _stem(g, 0x5B3A1E, 0.48, 0.18, 0.04);
            break;
        }
        case 'Mangosteen': {
            const body = new THREE.Mesh(_bumpySphere(0.68, 0.04, 5, 24), _phong(0xffffff, 50));
            _skinned(body, _skin('#4A2468', {
                blush: { color: '#361A50', x: 170, y: 100, r: 85, alpha: 0.4 },
                speckles: 60
            }));
            g.add(body);
            const crownMat = _phong(0x7A3BA8, 40);
            for (let i = 0; i < 4; i++) {
                const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
                const lobe = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), crownMat);
                lobe.scale.set(0.5, 0.16, 1.3);
                lobe.position.set(Math.cos(a) * 0.3, 0.62, Math.sin(a) * 0.3);
                lobe.rotation.y = a;
                g.add(lobe);
            }
            break;
        }
        default: {
            const m = new THREE.Mesh(new THREE.SphereGeometry(0.7, 24, 18), _phong((typeof fruitColors !== 'undefined' && fruitColors[name]) || 0xFF3B30, 60));
            g.add(m);
        }
    }

    return g;
}
