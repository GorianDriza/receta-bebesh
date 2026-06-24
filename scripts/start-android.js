const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWindows = process.platform === 'win32';
const localAppData = process.env.LOCALAPPDATA || '';
const defaultSdkRoot = localAppData
  ? path.join(localAppData, 'Android', 'Sdk')
  : null;
const sdkRoot =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  defaultSdkRoot ||
  '';

function sdkTool(relativePath, fallback) {
  if (!sdkRoot) {
    return fallback;
  }

  const absolutePath = path.join(sdkRoot, ...relativePath.split('/'));
  return fs.existsSync(absolutePath) ? absolutePath : fallback;
}

const adb = sdkTool(
  isWindows ? 'platform-tools/adb.exe' : 'platform-tools/adb',
  'adb',
);
const emulator = sdkTool(
  isWindows ? 'emulator/emulator.exe' : 'emulator/emulator',
  'emulator',
);
const expoCli = isWindows ? 'cmd.exe' : 'npx';

function runCapture(command, args) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function listDevices() {
  const output = runCapture(adb, ['devices']);

  return output
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [serial, state] = line.split(/\s+/);
      return { serial, state };
    });
}

function listAvds() {
  const output = runCapture(emulator, ['-list-avds']);
  return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBootCompleted(serial) {
  try {
    return runCapture(adb, ['-s', serial, 'shell', 'getprop', 'sys.boot_completed']);
  } catch {
    return '';
  }
}

function ensureReverse(serial, remotePort, localPort) {
  try {
    runCapture(adb, [
      '-s',
      serial,
      'reverse',
      `tcp:${remotePort}`,
      `tcp:${localPort}`,
    ]);
  } catch (error) {
    throw new Error(
      `Failed to configure adb reverse for ${serial} on port ${remotePort}.`,
    );
  }
}

async function waitForBoot(timeoutMs) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const readyDevice = listDevices().find(({ state }) => state === 'device');

    if (readyDevice && getBootCompleted(readyDevice.serial) === '1') {
      return readyDevice.serial;
    }

    await sleep(5000);
  }

  return null;
}

async function ensureAndroidDevice() {
  const connectedDevice = listDevices().find(({ state }) => state === 'device');
  if (connectedDevice && getBootCompleted(connectedDevice.serial) === '1') {
    return connectedDevice.serial;
  }

  const bootingEmulator = listDevices().find(
    ({ serial }) => serial && serial.startsWith('emulator-'),
  );
  if (!bootingEmulator) {
    const avds = listAvds();
    if (avds.length === 0) {
      throw new Error(
        'No Android emulators found. Create one first with the Android SDK emulator tools.',
      );
    }

    const preferredNames = [
      process.env.ANDROID_AVD_NAME,
      'Pixel_9_API_36_Goria',
      'Pixel_9_API_36',
    ].filter(Boolean);

    const avdToStart =
      preferredNames.find((name) => avds.includes(name)) || avds[0];

    console.log(`Starting Android emulator: ${avdToStart}`);
    const emulatorProcess = spawn(
      emulator,
      ['-avd', avdToStart, '-no-snapshot-load'],
      {
        detached: true,
        stdio: 'ignore',
      },
    );
    emulatorProcess.unref();
  } else {
    console.log(`Waiting for Android emulator: ${bootingEmulator.serial}`);
  }

  const serial = await waitForBoot(240000);
  if (!serial) {
    throw new Error('Android emulator did not finish booting within 4 minutes.');
  }

  return serial;
}

async function main() {
  if (!sdkRoot || !fs.existsSync(sdkRoot)) {
    throw new Error(
      'Android SDK not found. Set ANDROID_HOME or install the Android SDK first.',
    );
  }

  const extraPaths = [
    path.join(sdkRoot, 'platform-tools'),
    path.join(sdkRoot, 'emulator'),
  ];
  const env = {
    ...process.env,
    ANDROID_HOME: sdkRoot,
    ANDROID_SDK_ROOT: sdkRoot,
    PATH: `${extraPaths.join(path.delimiter)}${path.delimiter}${process.env.PATH || ''}`,
  };

  const serial = await ensureAndroidDevice();
  console.log(`Android device ready: ${serial}`);
  ensureReverse(serial, 8081, 8081);

  const expoArgs = isWindows
    ? ['/d', '/s', '/c', 'npx expo start --dev-client --localhost --android']
    : ['expo', 'start', '--dev-client', '--localhost', '--android'];

  const expoProcess = spawn(expoCli, expoArgs, {
    stdio: 'inherit',
    env,
  });

  expoProcess.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
