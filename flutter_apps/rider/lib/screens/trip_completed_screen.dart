import 'package:flutter/material.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import 'package:provider/provider.dart';
import '../main.dart';
import '../services/api_service.dart';

class TripCompletedScreen extends StatefulWidget {
  const TripCompletedScreen({super.key});

  @override
  State<TripCompletedScreen> createState() => _TripCompletedScreenState();
}

class _TripCompletedScreenState extends State<TripCompletedScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnim;
  double _rating = 5;
  final _reviewController = TextEditingController();
  bool _submitted = false;
  late Map<String, dynamic> _ride;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 800));
    _scaleAnim = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
    );
    _controller.forward();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _ride = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>? ??
        context.read<AppState>().currentRide ?? {};
  }

  Future<void> _submitRating() async {
    setState(() => _submitted = true);
    try {
      await ApiService.updateRide(_ride['id'] as int, {
        'driverRating': _rating.toInt(),
        'driverReview': _reviewController.text.trim(),
      });
    } catch (_) {}
    if (!mounted) return;
    context.read<AppState>().setCurrentRide(null);
    Navigator.pushReplacementNamed(context, '/home');
  }

  @override
  void dispose() {
    _controller.dispose();
    _reviewController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final fare = _ride['final_fare'] ?? _ride['estimated_fare'] ?? 0;
    final driverName = _ride['driver_name'] as String? ?? 'ড্রাইভার';

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 32),
              ScaleTransition(
                scale: _scaleAnim,
                child: Column(
                  children: [
                    Container(
                      width: 110,
                      height: 110,
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Center(child: Text('✅', style: TextStyle(fontSize: 56))),
                    ),
                    const SizedBox(height: 20),
                    const Text('যাত্রা সম্পন্ন!', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text('নিরাপদে পৌঁছেছেন', style: TextStyle(color: Colors.grey[600], fontSize: 16)),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              // Fare card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF6C3DF4), Color(0xFF3B82F6)]),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  children: [
                    Text('মোট ভাড়া', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 14)),
                    Text('₹${fare.toString()}',
                      style: const TextStyle(color: Colors.white, fontSize: 40, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text('✅ পেমেন্ট সম্পন্ন', style: TextStyle(color: Colors.white, fontSize: 13)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),
              // Rating
              Text('$driverName কে রেটিং দিন', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
              const SizedBox(height: 12),
              RatingBar.builder(
                initialRating: _rating,
                minRating: 1,
                allowHalfRating: false,
                itemCount: 5,
                itemSize: 40,
                itemBuilder: (ctx, _) => const Icon(Icons.star, color: Color(0xFFFFC107)),
                onRatingUpdate: (r) => setState(() => _rating = r),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _reviewController,
                maxLines: 2,
                decoration: const InputDecoration(
                  hintText: 'যাত্রা কেমন ছিল? (ঐচ্ছিক)',
                  labelText: 'মন্তব্য',
                ),
              ),
              const SizedBox(height: 28),
              ElevatedButton(
                onPressed: _submitted ? null : _submitRating,
                child: const Text('জমা দিন ও হোমে ফিরুন'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
