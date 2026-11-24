/** Description: Modal interativo de pré-visualização, rotação e recorte (crop) de imagem usando expo-image-manipulator. */
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image as RNImage,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeProvider';

export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageBounds {
  offsetX: number;
  offsetY: number;
  displayWidth: number;
  displayHeight: number;
  naturalWidth: number;
  naturalHeight: number;
}

type ProporcaoPreset = 'livre' | '1:1' | '4:3' | '16:9';

const MIN_CROP_SIZE = 60;

export function calcularImageBounds(
  containerW: number,
  containerH: number,
  naturalW: number,
  naturalH: number
): ImageBounds {
  if (containerW <= 0 || containerH <= 0 || naturalW <= 0 || naturalH <= 0) {
    return {
      offsetX: 0,
      offsetY: 0,
      displayWidth: Math.max(1, containerW),
      displayHeight: Math.max(1, containerH),
      naturalWidth: Math.max(1, naturalW),
      naturalHeight: Math.max(1, naturalH),
    };
  }
  const scale = Math.min(containerW / naturalW, containerH / naturalH);
  const displayWidth = naturalW * scale;
  const displayHeight = naturalH * scale;
  return {
    offsetX: (containerW - displayWidth) / 2,
    offsetY: (containerH - displayHeight) / 2,
    displayWidth,
    displayHeight,
    naturalWidth: naturalW,
    naturalHeight: naturalH,
  };
}

export function calcularRetanguloCortePixels(cropBox: CropBox, bounds: ImageBounds) {
  const scaleX = bounds.naturalWidth / bounds.displayWidth;
  const scaleY = bounds.naturalHeight / bounds.displayHeight;

  const relX = Math.max(0, cropBox.x - bounds.offsetX);
  const relY = Math.max(0, cropBox.y - bounds.offsetY);

  const originX = Math.min(bounds.naturalWidth - 1, Math.max(0, Math.round(relX * scaleX)));
  const originY = Math.min(bounds.naturalHeight - 1, Math.max(0, Math.round(relY * scaleY)));

  const maxW = bounds.naturalWidth - originX;
  const maxH = bounds.naturalHeight - originY;

  const width = Math.min(maxW, Math.max(1, Math.round(cropBox.width * scaleX)));
  const height = Math.min(maxH, Math.max(1, Math.round(cropBox.height * scaleY)));

  return { originX, originY, width, height };
}

interface ImageCropModalProps {
  visible: boolean;
  imageUri: string | null;
  onCancel: () => void;
  onConfirm: (croppedUri: string) => Promise<void> | void;
}

export function ImageCropModal({ visible, imageUri, onCancel, onConfirm }: ImageCropModalProps) {
  const { colors: Colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [workingUri, setWorkingUri] = useState<string | null>(imageUri);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, width: 100, height: 100 });
  const [preset, setPreset] = useState<ProporcaoPreset>('livre');
  const [processando, setProcessando] = useState(false);

  const cropBoxRef = useRef(cropBox);
  cropBoxRef.current = cropBox;

  useEffect(() => {
    setWorkingUri(imageUri);
    setPreset('livre');
    setNaturalSize(null);
  }, [imageUri, visible]);

  useEffect(() => {
    if (!visible || !workingUri) return;
    let ativo = true;
    RNImage.getSize(
      workingUri,
      (width, height) => {
        if (ativo) setNaturalSize({ width, height });
      },
      () => {
        if (ativo) setNaturalSize({ width: 1080, height: 1080 });
      }
    );
    return () => {
      ativo = false;
    };
  }, [visible, workingUri]);

  const bounds = useMemo(() => {
    if (!naturalSize || containerSize.width <= 0 || containerSize.height <= 0) return null;
    return calcularImageBounds(containerSize.width, containerSize.height, naturalSize.width, naturalSize.height);
  }, [containerSize, naturalSize]);

  const boundsRef = useRef<ImageBounds | null>(null);
  boundsRef.current = bounds;

  useEffect(() => {
    if (!bounds) return;
    setCropBox({
      x: bounds.offsetX,
      y: bounds.offsetY,
      width: bounds.displayWidth,
      height: bounds.displayHeight,
    });
  }, [bounds]);

  const aplicarPreset = (novoPreset: ProporcaoPreset) => {
    setPreset(novoPreset);
    if (!bounds) return;

    if (novoPreset === 'livre') {
      setCropBox({
        x: bounds.offsetX,
        y: bounds.offsetY,
        width: bounds.displayWidth,
        height: bounds.displayHeight,
      });
      return;
    }

    const ratio = novoPreset === '1:1' ? 1 : novoPreset === '4:3' ? 4 / 3 : 16 / 9;
    let w = bounds.displayWidth;
    let h = w / ratio;
    if (h > bounds.displayHeight) {
      h = bounds.displayHeight;
      w = h * ratio;
    }

    setCropBox({
      x: bounds.offsetX + (bounds.displayWidth - w) / 2,
      y: bounds.offsetY + (bounds.displayHeight - h) / 2,
      width: w,
      height: h,
    });
  };

  const dragStartRef = useRef<CropBox>({ x: 0, y: 0, width: 0, height: 0 });

  const moveResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragStartRef.current = cropBoxRef.current;
        },
        onPanResponderMove: (_, g) => {
          const b = boundsRef.current;
          if (!b) return;
          const start = dragStartRef.current;
          const maxX = b.offsetX + b.displayWidth - start.width;
          const maxY = b.offsetY + b.displayHeight - start.height;
          setCropBox({
            ...start,
            x: Math.min(maxX, Math.max(b.offsetX, start.x + g.dx)),
            y: Math.min(maxY, Math.max(b.offsetY, start.y + g.dy)),
          });
        },
      }),
    []
  );

  const criarCornerResponder = (canto: 'tl' | 'tr' | 'bl' | 'br') =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStartRef.current = cropBoxRef.current;
      },
      onPanResponderMove: (_, g) => {
        const b = boundsRef.current;
        if (!b) return;
        const s = dragStartRef.current;
        const minX = b.offsetX;
        const minY = b.offsetY;
        const maxRight = b.offsetX + b.displayWidth;
        const maxBottom = b.offsetY + b.displayHeight;

        let { x, y, width, height } = s;

        if (canto === 'tl' || canto === 'bl') {
          const novoX = Math.min(s.x + s.width - MIN_CROP_SIZE, Math.max(minX, s.x + g.dx));
          width = s.x + s.width - novoX;
          x = novoX;
        } else {
          width = Math.min(maxRight - s.x, Math.max(MIN_CROP_SIZE, s.width + g.dx));
        }

        if (canto === 'tl' || canto === 'tr') {
          const novoY = Math.min(s.y + s.height - MIN_CROP_SIZE, Math.max(minY, s.y + g.dy));
          height = s.y + s.height - novoY;
          y = novoY;
        } else {
          height = Math.min(maxBottom - s.y, Math.max(MIN_CROP_SIZE, s.height + g.dy));
        }

        setCropBox({ x, y, width, height });
      },
    });

  const tlResponder = useMemo(() => criarCornerResponder('tl'), []);
  const trResponder = useMemo(() => criarCornerResponder('tr'), []);
  const blResponder = useMemo(() => criarCornerResponder('bl'), []);
  const brResponder = useMemo(() => criarCornerResponder('br'), []);

  const handleGirar = async () => {
    if (!workingUri || processando) return;
    setProcessando(true);
    try {
      const res = await ImageManipulator.manipulateAsync(workingUri, [{ rotate: 90 }], {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      setNaturalSize(null);
      setWorkingUri(res.uri);
    } finally {
      setProcessando(false);
    }
  };

  const handleConfirmar = async () => {
    if (!workingUri || !bounds || processando) return;
    setProcessando(true);
    try {
      const crop = calcularRetanguloCortePixels(cropBox, bounds);
      const res = await ImageManipulator.manipulateAsync(workingUri, [{ crop }], {
        compress: 0.85,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      await onConfirm(res.uri);
    } finally {
      setProcessando(false);
    }
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.topBar}>
          <Pressable hitSlop={10} onPress={onCancel} style={styles.iconBtn} accessibilityLabel="Cancelar corte">
            <Ionicons name="close" size={22} color="#FFF" />
          </Pressable>
          <AppText variant="label" color="#FFF">
            Ajustar e Cortar Foto
          </AppText>
          <Pressable
            hitSlop={10}
            onPress={handleGirar}
            disabled={processando}
            style={styles.iconBtn}
            accessibilityLabel="Girar imagem">
            <Ionicons name="refresh-outline" size={20} color="#FFF" />
          </Pressable>
        </View>

        <View style={styles.stage} onLayout={handleLayout}>
          {workingUri && (
            <RNImage source={{ uri: workingUri }} style={styles.previewImg} resizeMode="contain" />
          )}

          {bounds ? (
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
              <View
                {...moveResponder.panHandlers}
                style={[
                  styles.cropFrame,
                  {
                    left: cropBox.x,
                    top: cropBox.y,
                    width: cropBox.width,
                    height: cropBox.height,
                    borderColor: Colors.primary,
                  },
                ]}>
                <View style={styles.gridH1} />
                <View style={styles.gridH2} />
                <View style={styles.gridV1} />
                <View style={styles.gridV2} />

                <View {...tlResponder.panHandlers} style={[styles.handle, styles.handleTL]} />
                <View {...trResponder.panHandlers} style={[styles.handle, styles.handleTR]} />
                <View {...blResponder.panHandlers} style={[styles.handle, styles.handleBL]} />
                <View {...brResponder.panHandlers} style={[styles.handle, styles.handleBR]} />
              </View>
            </View>
          ) : (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={Colors.primary} size="large" />
            </View>
          )}
        </View>

        <View style={styles.bottomBar}>
          <View style={styles.presetsRow}>
            {(['livre', '1:1', '4:3', '16:9'] as ProporcaoPreset[]).map((p) => {
              const ativo = preset === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => aplicarPreset(p)}
                  style={[styles.presetChip, ativo && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}>
                  <AppText variant="caption" color="#FFF">
                    {p === 'livre' ? 'Livre' : p}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actionsRow}>
            <Button label="Cancelar" variant="secondary" onPress={onCancel} disabled={processando} style={styles.actionBtn} />
            <Button
              label="Cortar e Anexar"
              icon="crop-outline"
              loading={processando}
              onPress={handleConfirmar}
              style={styles.actionBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F17' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
    marginHorizontal: Spacing.two,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImg: { width: '100%', height: '100%' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropFrame: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  gridH1: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '33.3%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  gridH2: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '66.6%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  gridV1: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '33.3%',
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  gridV2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '66.6%',
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  handle: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#0B0F17',
  },
  handleTL: { top: -12, left: -12 },
  handleTR: { top: -12, right: -12 },
  handleBL: { bottom: -12, left: -12 },
  handleBR: { bottom: -12, right: -12 },
  bottomBar: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
    backgroundColor: '#111827',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionBtn: { flex: 1 },
});
