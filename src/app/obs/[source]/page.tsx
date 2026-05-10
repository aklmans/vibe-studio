import { notFound } from "next/navigation";
import ObsSourceClient from "../../../components/obs/ObsSourceClient";
import { normalizeObsCameraMode } from "../../../lib/obs-camera";
import { isObsSource } from "../../../lib/obs-sources";

export const dynamic = "force-dynamic";

export default async function ObsPage({
  params,
  searchParams,
}: {
  params: Promise<{ source: string }>;
  searchParams: Promise<{ camera?: string | string[] }>;
}) {
  const { source } = await params;
  if (!isObsSource(source)) notFound();

  const { camera } = await searchParams;
  const cameraMode = normalizeObsCameraMode(Array.isArray(camera) ? camera[0] : camera);

  return <ObsSourceClient source={source} cameraMode={cameraMode} />;
}
