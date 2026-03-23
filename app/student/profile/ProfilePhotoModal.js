"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import styles from "../student.module.css";
import { getCroppedImg } from "./cropImage";

const STEPS = {
  PICK: "pick",
  CROP: "crop",
  PREVIEW: "preview",
};

export default function ProfilePhotoModal({ open, onClose, onSave, saving }) {
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(STEPS.PICK);
  const [imageSrc, setImageSrc] = useState("");
  const [previewDataUrl, setPreviewDataUrl] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const reset = useCallback(() => {
    setImageSrc((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return "";
    });
    setStep(STEPS.PICK);
    setPreviewDataUrl("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onCropComplete = useCallback((_area, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  function handlePickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setStep(STEPS.CROP);
  }

  async function handleCropConfirm() {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const dataUrl = await getCroppedImg(imageSrc, croppedAreaPixels);
      setPreviewDataUrl(dataUrl);
      setStep(STEPS.PREVIEW);
    } catch {
      // eslint-disable-next-line no-alert
      alert("画像の処理に失敗しました。別の画像をお試しください。");
    }
  }

  async function handleFinalSave() {
    if (!previewDataUrl) return;
    await onSave(previewDataUrl);
  }

  function handleBackFromCrop() {
    if (imageSrc.startsWith("blob:")) URL.revokeObjectURL(imageSrc);
    setImageSrc("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setStep(STEPS.PICK);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleBackFromPreview() {
    setPreviewDataUrl("");
    setStep(STEPS.CROP);
  }

  if (!open) return null;

  return (
    <div
      className={styles.photoModalOverlay}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.photoModalCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="photo-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="photo-modal-title" className={styles.photoModalTitle}>
          プロフィール写真
        </h2>

        {step === STEPS.PICK ? (
          <div className={styles.photoModalBody}>
            <p className={styles.photoModalLead}>表示する写真を選んでください。</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.photoModalHiddenInput}
              onChange={handlePickFile}
            />
            <button type="button" className={styles.photoModalPrimaryBtn} onClick={() => fileInputRef.current?.click()}>
              ファイルを選択
            </button>
            <div className={styles.photoModalActions}>
              <button type="button" className={styles.photoModalGhostBtn} onClick={onClose}>
                閉じる
              </button>
            </div>
          </div>
        ) : null}

        {step === STEPS.CROP ? (
          <div className={styles.photoModalBody}>
            <p className={styles.photoModalLead}>表示範囲を調整してください（ドラッグで位置、スライダーで拡大）。</p>
            <div className={styles.photoModalCropWrap}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <label className={styles.photoModalZoomLabel}>
              拡大
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </label>
            <div className={styles.photoModalActions}>
              <button type="button" className={styles.photoModalGhostBtn} onClick={handleBackFromCrop}>
                戻る
              </button>
              <button type="button" className={styles.photoModalPrimaryBtn} onClick={handleCropConfirm} disabled={!croppedAreaPixels}>
                範囲を決定
              </button>
            </div>
          </div>
        ) : null}

        {step === STEPS.PREVIEW ? (
          <div className={styles.photoModalBody}>
            <p className={styles.photoModalLead}>この内容で保存します。問題なければ「保存する」を押してください。</p>
            <div className={styles.photoModalPreviewRing}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewDataUrl} alt="プレビュー" className={styles.photoModalPreviewImg} />
            </div>
            <div className={styles.photoModalActions}>
              <button type="button" className={styles.photoModalGhostBtn} onClick={handleBackFromPreview} disabled={saving}>
                戻る
              </button>
              <button type="button" className={styles.photoModalPrimaryBtn} onClick={handleFinalSave} disabled={saving}>
                {saving ? "保存中..." : "保存する"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
