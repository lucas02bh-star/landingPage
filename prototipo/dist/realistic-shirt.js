// Procedural garment mesh. Unlike an extruded flat silhouette, the body,
// shoulders, collar and sleeves are all independent curved 3D surfaces.
// The front/back artwork is projected onto the curved torso with UVs.

export function buildRealisticShirt(THREE, frontTexture, backTexture, flagImage) {
  const garment = new THREE.Group();
  const fabric = texture => new THREE.MeshStandardMaterial({
    map: texture, color: 0xffffff, roughness: .98, metalness: 0,
    side: THREE.DoubleSide
  });
  const frontMaterial = fabric(frontTexture);
  const rearMaterial = fabric(backTexture);
  const plainMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e1f21, roughness: .99, metalness: 0, side: THREE.DoubleSide
  });
  const hemMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2b2e, roughness: .93, metalness: 0, side: THREE.DoubleSide
  });

  const bottomY = -1.28;
  const topY = 1.015;

  function torsoDimensions(t) {
    const chest = Math.sin(Math.PI * t);
    return {
      x: .605 + .075 * chest + .055 * t,
      z: .240 + .052 * chest + .008 * t
    };
  }

  function torsoPoint(theta, t) {
    const yBase = bottomY + (topY - bottomY) * t;
    const d = torsoDimensions(t);
    const wrinkle = Math.sin(Math.PI * t);
    const ripple = wrinkle * (.013 * Math.sin(12 * t + theta * 5) + .007 * Math.cos(23 * t - 3 * theta));
    const foldAtHem = (1 - t) ** 9 * .016 * Math.sin(theta * 7);
    const x = d.x * Math.cos(theta) + ripple * Math.cos(theta);
    const z = d.z * Math.sin(theta) + ripple * Math.sin(theta);
    const y = yBase + foldAtHem;
    return [x, y, z];
  }

  function geometryFromRows(rowCount, columnCount, sample) {
    const positions = [], uvs = [], indices = [];
    for (let row = 0; row <= rowCount; row++) {
      for (let col = 0; col <= columnCount; col++) {
        const point = sample(row / rowCount, col / columnCount);
        positions.push(...point.xyz);
        uvs.push(...point.uv);
      }
    }
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < columnCount; c++) {
        const a = r * (columnCount + 1) + c;
        const b = a + columnCount + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  // The center front and back are convex fabric surfaces, not flat planes.
  for (const back of [false, true]) {
    const bodyGeometry = geometryFromRows(70, 68, (t, u) => {
      const theta = back ? Math.PI + Math.PI * u : Math.PI * u;
      const xyz = torsoPoint(theta, t);
      const [x, y] = xyz;
      return {
        xyz,
        uv: [back ? 1 - (x + 1.47) / 2.94 : (x + 1.47) / 2.94, (y + 1.43) / 2.78]
      };
    });
    const body = new THREE.Mesh(bodyGeometry, back ? rearMaterial : frontMaterial);
    garment.add(body);
  }

  // Shoulder fabric curves inward toward a real round neck opening.
  const shoulderGeometry = geometryFromRows(12, 96, (t, u) => {
    const theta = 2 * Math.PI * u;
    const p = torsoPoint(theta, 1);
    const neckX = .258 * Math.cos(theta);
    const neckZ = .165 * Math.sin(theta);
    const frontDip = Math.max(0, Math.sin(theta));
    const collarY = 1.126 - .145 * frontDip;
    const xyz = [
      p[0] * (1 - t) + neckX * t,
      p[1] * (1 - t) + collarY * t + .014 * Math.sin(Math.PI * t),
      p[2] * (1 - t) + neckZ * t
    ];
    return { xyz, uv: [u, t] };
  });
  garment.add(new THREE.Mesh(shoulderGeometry, plainMaterial));

  const sleeveFabric = makeSleeveTexture(THREE, flagImage);
  const sleeveFlagMaterial = fabric(sleeveFabric);
  const sleevePlainMaterial = fabric(makeSleeveTexture(THREE, null));

  function sleevePoint(sign, t, theta) {
    const cx = sign * (.625 + .635 * t);
    const cy = .949 - .257 * t;
    const radiusY = (.258 - .043 * t) * (1 + .018 * Math.sin(theta * 4 + t * 13));
    const radiusZ = .249 - .034 * t;
    // Axis points outwards and downwards. The perpendicular basis tilts the cuff.
    const perpX = sign * .375;
    const perpY = .927;
    const v = Math.sin(theta) * radiusY;
    const x = cx + perpX * v;
    const y = cy + perpY * v + .006 * Math.cos(5 * theta + 11 * t);
    const z = Math.cos(theta) * radiusZ;
    return [x, y, z];
  }

  for (const sign of [-1, 1]) {
    const sleeveGeometry = geometryFromRows(32, 72, (t, u) => {
      const theta = -Math.PI + 2 * Math.PI * u;
      return { xyz: sleevePoint(sign, t, theta), uv: [u, t] };
    });
    const sleeve = new THREE.Mesh(sleeveGeometry, sign === 1 ? sleeveFlagMaterial : sleevePlainMaterial);
    garment.add(sleeve);

    // Distinct folded cuff and open sleeve end, with a fine stitch line.
    const cuffGeo = geometryFromRows(3, 72, (t, u) => {
      const theta = -Math.PI + 2 * Math.PI * u;
      return { xyz: sleevePoint(sign, .948 + .052 * t, theta), uv: [u, t] };
    });
    const cuff = new THREE.Mesh(cuffGeo, new THREE.MeshStandardMaterial({color:0x222326,roughness:.96,side:THREE.DoubleSide,transparent:true,opacity:.22}));
    garment.add(cuff);

    const cuffPoints = [];
    for (let k = 0; k <= 80; k++) cuffPoints.push(new THREE.Vector3(...sleevePoint(sign, .995, -Math.PI + 2 * Math.PI * k / 80)));
    const cuffCurve = new THREE.CatmullRomCurve3(cuffPoints, true);
    garment.add(new THREE.Mesh(new THREE.TubeGeometry(cuffCurve, 80, .009, 5, true), hemMaterial));
  }

  // Ribbed collar follows the asymmetrical front scoop and raised back neck.
  const neckPoints = [];
  for (let i = 0; i <= 80; i++) {
    const theta = 2 * Math.PI * i / 80;
    neckPoints.push(new THREE.Vector3(
      .258 * Math.cos(theta),
      1.126 - .145 * Math.max(0, Math.sin(theta)),
      .165 * Math.sin(theta)
    ));
  }
  const collarPath = new THREE.CatmullRomCurve3(neckPoints, true);
  garment.add(new THREE.Mesh(
    new THREE.TubeGeometry(collarPath, 96, .029, 8, true),
    new THREE.MeshStandardMaterial({color:0x2c2d31,roughness:.93,metalness:0})
  ));
  const innerNeck = new THREE.Mesh(new THREE.TorusGeometry(.205, .014, 8, 64), hemMaterial);
  innerNeck.rotation.x = Math.PI / 2;
  innerNeck.position.y = 1.066;
  innerNeck.scale.set(1.28, .82, 1);
  garment.add(innerNeck);

  // A slight double-fabric hem is visible during the 180° back reveal.
  const hemPoints = [];
  for (let i = 0; i <= 100; i++) {
    const theta = 2 * Math.PI * i / 100;
    hemPoints.push(new THREE.Vector3(...torsoPoint(theta, .018)));
  }
  const hemPath = new THREE.CatmullRomCurve3(hemPoints, true);
  garment.add(new THREE.Mesh(new THREE.TubeGeometry(hemPath, 100, .008, 5, true), hemMaterial));

  // Natural asymmetry in the loose drape, kept subtle so prints stay legible.
  garment.rotation.z = -.012;
  return garment;
}

function makeSleeveTexture(THREE, flagImage) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const c = canvas.getContext('2d');
  const fill = c.createLinearGradient(0, 0, 1024, 512);
  fill.addColorStop(0, '#222326');
  fill.addColorStop(.5, '#17181a');
  fill.addColorStop(1, '#242326');
  c.fillStyle = fill;
  c.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 1600; i++) {
    c.fillStyle = i % 3 ? 'rgba(255,255,255,.012)' : 'rgba(0,0,0,.025)';
    c.fillRect((i * 127.7) % 1024, (i * 91.3) % 512, 1, 2);
  }
  if (flagImage) {
    c.globalCompositeOperation = 'screen';
    c.drawImage(flagImage, 326, 150, 372, 222);
    c.globalCompositeOperation = 'source-over';
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
