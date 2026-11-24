/** Description: Modal com CameraView embutida (expo-camera) para captura de evidência fotográfica do caderno. */
import { Ionicons } from '@expo/vector-icons';
import { CameraView, type CameraType, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/providers/ThemeProvider';

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (uriTemp: string) => Promise<void> | void;
  onFallbackSystemCamera?: () => Promise<void> | void;
}

export function CameraModal({ visible, onClose, onCapture, onFallbackSystemCamera }: CameraModalProps) {
  const { colors: Colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permissao, solicitarPermissao] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [capturando, setCapturando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleTirarFoto = async () => {
    if (!cameraRef.current || capturando) return;
    setCapturando(true);
    setErro(null);
    try {
      const foto = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (foto?.uri) {
        await onCapture(foto.uri);
        onClose();
      }
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível capturar a foto');
    } finally {
      setCapturando(false);
    }
  };

  const bloqueadoPermanentemente = permissao && !permissao.granted && permissao.canAskAgain === false;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: '#000', paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.topBar}>
          <Pressable hitSlop={10} onPress={onClose} style={styles.iconPill}>
            <Ionicons name="close" size={22} color="#FFF" />
          </Pressable>
          <AppText variant="label" color="#FFF">
            Foto do Caderno
          </AppText>
          <Pressable
            hitSlop={10}
            onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
            style={styles.iconPill}>
            <Ionicons name={flash === 'on' ? 'flash' : 'flash-off'} size={20} color="#FFF" />
          </Pressable>
        </View>

        {!permissao ? (
          <View style={styles.centerBox}>
            <AppText variant="body" color="#FFF">
              Verificando permissão da câmera...
            </AppText>
          </View>
        ) : !permissao.granted ? (
          <View style={styles.centerBox}>
            <Ionicons name="camera-outline" size={48} color={Colors.primary} />
            <AppText variant="title" color="#FFF" style={styles.centerText}>
              Permissão de Câmera Necessária
            </AppText>
            <AppText variant="body" color="#CBD5E1" style={styles.centerText}>
              {bloqueadoPermanentemente
                ? 'A permissão da câmera foi negada permanentemente. Habilite nas configurações do sistema.'
                : 'Autorize o acesso à câmera para fotografar suas anotações de estudo.'}
            </AppText>
            {bloqueadoPermanentemente ? (
              <Button
                label="Abrir Configurações"
                icon="settings-outline"
                onPress={() => Linking.openSettings().catch(() => {})}
              />
            ) : (
              <Button label="Permitir Câmera" icon="camera" onPress={() => solicitarPermissao()} />
            )}
            {onFallbackSystemCamera && (
              <Button
                label="Usar Câmera do Sistema"
                variant="secondary"
                onPress={async () => {
                  onClose();
                  await onFallbackSystemCamera();
                }}
              />
            )}
          </View>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView ref={cameraRef} style={styles.camera} facing={facing} flash={flash} />
            {erro && (
              <View style={styles.errorBanner}>
                <AppText variant="caption" color="#FCA5A5">
                  {erro}
                </AppText>
              </View>
            )}
            <View style={styles.controlsBar}>
              <Pressable
                hitSlop={10}
                onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
                style={styles.controlSecondary}>
                <Ionicons name="camera-reverse-outline" size={24} color="#FFF" />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Capturar foto"
                disabled={capturando}
                onPress={handleTirarFoto}
                style={[styles.shutterOuter, capturando && { opacity: 0.6 }]}>
                <View style={styles.shutterInner} />
              </Pressable>

              {onFallbackSystemCamera ? (
                <Pressable
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir câmera do sistema"
                  onPress={async () => {
                    onClose();
                    await onFallbackSystemCamera();
                  }}
                  style={styles.controlSecondary}>
                  <Ionicons name="expand-outline" size={22} color="#FFF" />
                </Pressable>
              ) : (
                <View style={styles.controlSpacer} />
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  iconPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  centerText: { textAlign: 'center' },
  cameraWrap: { flex: 1, position: 'relative' },
  camera: { flex: 1, borderRadius: Radius.lg, overflow: 'hidden' },
  errorBanner: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.75)',
    padding: Spacing.two,
    borderRadius: Radius.md,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    backgroundColor: '#000',
  },
  controlSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlSpacer: { width: 48, height: 48 },
  shutterOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFF',
  },
});

