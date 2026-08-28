import 'package:flutter/material.dart';
import 'package:pinput/pinput.dart';
import 'package:provider/provider.dart';
import '../main.dart';
import '../services/api_service.dart';

class ActiveTripScreen extends StatefulWidget {
  const ActiveTripScreen({super.key});
  @override
  State<ActiveTripScreen> createState() => _ActiveTripScreenState();
}

class _ActiveTripScreenState extends State<ActiveTripScreen> {
  final _pinCtrl = TextEditingController();
  bool _pinVerified = false;
  bool _tripStarted = false;
  bool _loading = false;
  String? _pinError;

  Future<void> _verifyPin() async {
    final pin = _pinCtrl.text;
    final ride = context.read<DriverAppState>().currentRide;
    if (ride == null || pin.length < 4) return;
    setState(() { _loading = true; _pinError = null; });
    try {
      await ApiService.updateRide(ride['id'] as int, {'status': 'ongoing', 'otpPin': pin});
      setState(() { _pinVerified = true; _tripStarted = true; });
    } on ApiException catch (e) {
      setState(() => _pinError = e.message);
      _pinCtrl.clear();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _completeTrip() async {
    final ride = context.read<DriverAppState>().currentRide;
    if (ride == null) return;
    setState(() => _loading = true);
    try {
      await ApiService.updateRide(ride['id'] as int, {
        'status': 'completed',
        'finalFare': ride['estimated_fare'],
      });
      context.read<DriverAppState>().setCurrentRide(null);
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, '/cockpit');
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('সমস্যা: $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() { _pinCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final ride = context.watch<DriverAppState>().currentRide;

    return WillPopScope(
      onWillPop: () async => false,
      child: Scaffold(
        appBar: AppBar(title: const Text('সক্রিয় যাত্রা')),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              // Status badge
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: _tripStarted
                        ? [const Color(0xFF064E3B), const Color(0xFF047857)]
                        : [const Color(0xFF1E293B), const Color(0xFF334155)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    Text(
                      _tripStarted ? '🛣️ যাত্রা চলছে' : '📍 যাত্রী পিকআপের অপেক্ষা',
                      style: TextStyle(
                        color: _tripStarted ? const Color(0xFF10B981) : Colors.white70,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    if (ride != null) ...[
                      const SizedBox(height: 12),
                      Text(ride['dropoff_address'] as String? ?? '—',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500),
                        textAlign: TextAlign.center,
                        overflow: TextOverflow.ellipsis),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // OTP PIN verification (before trip starts)
              if (!_pinVerified) ...[
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFF334155)),
                  ),
                  child: Column(
                    children: [
                      const Text('🔐', style: TextStyle(fontSize: 40)),
                      const SizedBox(height: 12),
                      const Text('যাত্রীর OTP PIN লিখুন',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 6),
                      Text('যাত্রা শুরুর আগে যাত্রীর PIN যাচাই করুন',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13)),
                      const SizedBox(height: 24),
                      Pinput(
                        length: 4,
                        controller: _pinCtrl,
                        defaultPinTheme: PinTheme(
                          width: 62, height: 68,
                          textStyle: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0F172A),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFF334155), width: 2),
                          ),
                        ),
                        focusedPinTheme: PinTheme(
                          width: 62, height: 68,
                          textStyle: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0F172A),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFF22D3EE), width: 2),
                          ),
                        ),
                        autofocus: true,
                        onCompleted: (_) => _verifyPin(),
                      ),
                      if (_pinError != null) ...[
                        const SizedBox(height: 12),
                        Text(_pinError!, style: const TextStyle(color: Colors.red)),
                      ],
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: _loading ? null : _verifyPin,
                        child: _loading
                            ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Color(0xFF0F172A), strokeWidth: 2.5))
                            : const Text('PIN যাচাই করুন ও যাত্রা শুরু করুন'),
                      ),
                    ],
                  ),
                ),
              ] else ...[
                // Trip controls
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
                  ),
                  child: Column(
                    children: [
                      const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Icon(Icons.check_circle, color: Color(0xFF10B981)),
                        SizedBox(width: 8),
                        Text('PIN যাচাই সফল — যাত্রা শুরু হয়েছে',
                          style: TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold)),
                      ]),
                      const SizedBox(height: 20),
                      if (ride != null)
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text('আনুমানিক ভাড়া', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                              Text('₹${ride['estimated_fare']}',
                                style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                            ]),
                            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                              Text('পেমেন্ট', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                              Text(ride['payment_method'] as String? ?? 'cash',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                            ]),
                          ],
                        ),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: _loading ? null : _completeTrip,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          foregroundColor: Colors.white,
                        ),
                        child: _loading
                            ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                            : const Text('🏁  যাত্রা সম্পন্ন করুন'),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 20),
              // Emergency
              OutlinedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.warning_amber, color: Colors.red),
                label: const Text('জরুরি SOS — 112', style: TextStyle(color: Colors.red)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.red),
                  minimumSize: const Size.fromHeight(48),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
