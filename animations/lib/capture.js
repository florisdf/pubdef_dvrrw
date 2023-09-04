export default async function capture({
    tl, canvas, framerate = 30,
    motionBlurFrames = 5,
}) {
    const capturer = new CCapture({
        format: 'webm', framerate, motionBlurFrames
    });
    capturer.start();

    const nFrames = tl.duration() * framerate * motionBlurFrames;
    for (let t = 0; t <= nFrames; t++) {
        tl.progress(t / nFrames);
        capturer.capture(canvas);
        await new Promise(resolve => requestAnimationFrame(resolve));
    }
    capturer.stop();
    capturer.save();
}
