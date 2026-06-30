import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:fyp_student_app/app.dart';

void main() {
  testWidgets('App builds successfully', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: FypStudentApp(),
      ),
    );
    await tester.pump();

    expect(find.byType(FypStudentApp), findsOneWidget);
  });
}
