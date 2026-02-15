let cameraStarted = false;
let camera;

/* PAGE SWITCHING */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  if (id === "webcam" && !cameraStarted) {
    startWebcam();
    cameraStarted = true;
  }
}

/* ===== MEDIAPIPE ===== */
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const result = document.getElementById("result");

const pose = new Pose({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
});

pose.onResults(res => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(res.image, 0, 0, canvas.width, canvas.height);

  if (res.poseLandmarks) {
    const l = res.poseLandmarks[11];
    const r = res.poseLandmarks[12];
    const diff = Math.abs(l.y - r.y);

    result.innerText =
      diff > 0.035
        ? "⚠️ Shoulders appear uneven"
        : "✅ Shoulders appear level";
  }
});

function startWebcam() {
  camera = new Camera(video, {
    onFrame: async () => {
      await pose.send({ image: video });
    },
    width: 640,
    height: 480
  });
  camera.start();
}
