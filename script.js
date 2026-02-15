let camera = null;
let pose = null;

/* ===================== COMMON ===================== */
function stopCamera() {
  if (camera) {
    camera.stop();
    camera = null;
  }
}

/* ===================== SECTION CONTROL ===================== */
function openWebcam(type) {
  document.querySelectorAll(".content-section").forEach(sec => {
    sec.classList.add("hidden");
  });

  stopCamera();

  document.getElementById(type).classList.remove("hidden");

  if (type === "scoliosis") startScoliosis();
  if (type === "physio") startPhysio();
}

/* ===================== SCOLIOSIS (ONE CAMERA) ===================== */
function startScoliosis() {
  const video = document.getElementById("video1");
  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");
  const result = document.getElementById("result1");

  pose = new Pose({
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`
  });

  pose.setOptions({
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });

  pose.onResults(res => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(res.image, 0, 0, canvas.width, canvas.height);

    if (!res.poseLandmarks) {
      result.innerText = "No body detected";
      return;
    }

    const L = res.poseLandmarks[11];
    const R = res.poseLandmarks[12];
    const diff = Math.abs(L.y - R.y);

    result.innerText =
      diff > 0.05
        ? "⚠️ Shoulders appear unbalanced"
        : "✅ Shoulders appear level";
  });

  camera = new Camera(video, {
    onFrame: async () => await pose.send({ image: video }),
    width: 640,
    height: 480
  });

  camera.start();
}

/* ===================== PHYSIO (LEFT / RIGHT FIXED) ===================== */
let reps = 0;
let armUp = false;

function startPhysio() {
  const video = document.getElementById("video2");
  const canvas = document.getElementById("canvas2");
  const ctx = canvas.getContext("2d");
  const result = document.getElementById("result2");

  reps = 0;
  armUp = false;
  result.innerText = "Reps: 0";

  pose = new Pose({
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`
  });

  pose.setOptions({
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });

  pose.onResults(res => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(res.image, 0, 0, canvas.width, canvas.height);

    if (!res.poseLandmarks) return;

    const selectedArm =
      document.querySelector('input[name="arm"]:checked').value;

    const wrist =
      selectedArm === "right"
        ? res.poseLandmarks[16]
        : res.poseLandmarks[15];

    const shoulder =
      selectedArm === "right"
        ? res.poseLandmarks[12]
        : res.poseLandmarks[11];

    const threshold = 0.05;

    if (wrist.y < shoulder.y - threshold && !armUp) {
      armUp = true;
    }

    if (wrist.y > shoulder.y + threshold && armUp) {
      reps++;
      armUp = false;
      result.innerText = `Reps: ${reps}`;
    }
  });

  camera = new Camera(video, {
    onFrame: async () => await pose.send({ image: video }),
    width: 640,
    height: 480
  });

  camera.start();
}
