import SwiftUI

/// Applies the macOS 26 Liquid Glass material when running on Tahoe or later,
/// falling back to the classic vibrancy material on older systems.
/// Intel and Apple Silicon Macs both get glass on macOS 26+.
extension View {
    @ViewBuilder
    func liquidGlass<S: Shape>(in shape: S, interactive: Bool = false) -> some View {
        if #available(macOS 26.0, *) {
            if interactive {
                self.glassEffect(.regular.interactive(), in: shape)
            } else {
                self.glassEffect(.regular, in: shape)
            }
        } else {
            self.background(.ultraThinMaterial, in: shape)
        }
    }
}
