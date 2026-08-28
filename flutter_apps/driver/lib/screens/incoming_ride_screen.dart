import 'dart:async';
import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:provider/provider.dart';
import '../main.dart';
import '../services/api_service.dart';

class IncomingRideScreen extends StatefulWidget {
  const IncomingRideScreen({super.key});
  @override
  State<IncomingRideScreen> createState() => _IncomingRideScreenState();
}

class _IncomingRideScreenState extends State<IncomingRideScreen>
    with SingleTickerProviderStateMixin {
  static const _countdown = 15;
  int _remaining = _countdown;
  Timer? _timer;
  late AnimationController _pulseCtrl;
  late Animation<double> _pulseAnim;
  final _player = AudioPlayer();
  bool _acting = false;
  late Map<String, dynamic> _ride;

  @override
  void initState() {
    super.initState();
    _ride = context.read<DriverAppState>().incomingRide ?? {};
    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 800))
      ..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 1.0, end: 1.08).animate(_pulseCtrl);
    _playAlert();
    _startCountdown();
  }

  void _playAlert() async {
    try {
      // Play beep sound (replace with actual asset: assets/audio/ride_alert.mp3)
      // await _player.play(AssetSource('audio/ride_alert.mp3'), volume: 1.0);
    } catch (_) {}
  }

  void _startCountdown() {
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      setState(() => _remaining--);
      if (_remaining <= 0) {
        t.cancel();
        _decline();
      }
    });
  }

  Future<void> _accept() async {
    if (_acting) return;
    _timer?.cancel();
    await _player.stop();
    setState(() => _acting = true);
    try {
      final rideId = _ride['id'] as int;
      await ApiService.updateRide(rideId, {'status': 'accepted'});
      context.read<DriverAppState>().setCurrentRide(_ride);
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, '/active-trip');
    } catch (e) {
      setState(() => _acting = false);
    }
  }

  void _decline() {
    if (_acting) return;
    _timer?.cancel();
    _player.stop();
    context.read<DriverAppState>().setIncomingRide(null);
    if (mounted) Navigator.pushReplacementNamed(context, '/cockpit');
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pulseCtrl.dispose();
    _player.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final fare = _ride['estimated_fare'];
    final vehicleIcons = {'bike': '🏍️', 'auto': '🛺', 'sedan': '🚗', 'suv': '🚙', 'ev': '⚡'};
    final vehicleType = _ride['vehicle_type'] as String? ?? 'sedan';
    final distanceKm = _ride['distance_km'];

    return WillPopScope(
      onWillPop: () async { _decline(); return false; },
      child: Scaffold(
        body: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter, end: Alignment.bottomCenter,
              colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
            ),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  const SizedBox(height: 24),
                  // New ride badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.amber.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.amber.withOpacity(0.4)),
                    ),
                    child: const Text('🔔 নতুন রাইড অনুরোধ', style: TextStyle(color: Colors.amber, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(height: 32),

                  // Pulsing vehicle icon
                  ScaleTransition(
                    scale: _pulseAnim,
                    child: Container(
                      width: 120, height: 120,
                      decoration: BoxDecoration(
                        color: const Color(0xFF22D3EE).withOpacity(0.1),
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFF22D3EE).withOpacity(0.4), width: 3),
                        boxShadow: [
                          BoxShadow(color: const Color(0xFF22D3EE).withOpacity(0.2), blurRadius: 30, spreadRadius: 5),
                        ],
                      ),
                      child: Center(child: Text(vehicleIcons[vehicleType] ?? '🚗', style: const TextStyle(fontSize: 56))),
                    ),
                  ),
                  const SizedBox(height: 28),

                  // Countdown
                  Text(
                    '$_remaining',
                    style: TextStyle(
                      fontSize: 72,
                      fontWeight: FontWeight.bold,
                      color: _remaining <= 5 ? Colors.red : const Color(0xFF22D3EE),
                    ),
                  ),
                  Text('সেকেন্ডে অটো বাতিল', style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 13)),
                  const SizedBox(height: 32),

                  // Ride info card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF334155)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text('আনুমানিক আয়', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                              Text(fare != null ? '₹${(fare * 0.91).toStringAsFixed(0)}' : '—',
                                style: const TextStyle(color: Color(0xFF10B981), fontSize: 28, fontWeight: FontWeight.bold)),
                            ]),
                            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                              Text('দূরত্ব', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                              Text(distanceKm != null ? '${distanceKm} কিমি' : '—',
                                style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
                            ]),
                          ],
                        ),
                        const SizedBox(height: 16),
                        const Divider(color: Color(0xFF334155)),
                        const SizedBox(height: 12),
                        _routeRow(Icons.circle, const Color(0xFF22D3EE), _ride['pickup_address'] as String? ?? '—'),
                        const SizedBox(height: 8),
                        _routeRow(Icons.location_on, Colors.red, _ride['dropoff_address'] as String? ?? '—'),
                      ],
                    ),
                  ),
                  const Spacer(),

                  // Action buttons
                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: _decline,
                          child: Container(
                            height: 64,
                            decoration: BoxDecoration(
                              color: Colors.red.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(color: Colors.red.withOpacity(0.4)),
                            ),
                            child: const Center(child: Text('❌  প্রত্যাখ্যান', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 16))),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: GestureDetector(
                          onTap: _acting ? null : _accept,
                          child: Container(
                            height: 64,
                            decoration: BoxDecoration(
                              color: const Color(0xFF10B981),
                              borderRadius: BorderRadius.circular(18),
                            ),
                            child: _acting
                                ? const Center(child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                                : const Center(child: Text('✅  গ্রহণ', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16))),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _routeRow(IconData icon, Color color, String address) {
    return Row(children: [
      Icon(icon, color: color, size: 14),
      const SizedBox(width: 8),
      Expanded(child: Text(address, style: const TextStyle(color: Colors.white70, fontSize: 13), overflow: TextOverflow.ellipsis)),
    ]);
  }
}
