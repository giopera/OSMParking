# Contributing to Parking Capacity

Thank you for your interest in contributing to this project! Here's how you can help:

## Improving OpenStreetMap Data

The best way to contribute is by ensuring parking facilities in OpenStreetMap have proper capacity tags:

1. **Add parking facilities** to OSM if they're missing
2. **Add capacity tags** to existing parking amenities:
   - `amenity=parking` - Mark as parking facility
   - `capacity` - Total number of spaces
   - `capacity:disabled` - Accessible/disabled spaces
   - `capacity:parent` - Parent/child spaces
   - `capacity:baby` - Baby/child spaces
   - `capacity:charging` - EV charging spaces
   - `capacity:woman` - Women-specific spaces
   - `capacity:man` - Men-specific spaces

3. **Verify data accuracy** by visiting local parking facilities and updating information

## Developing the Application

### Setup Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/parking_capacity.git
   cd parking_capacity
   ```

3. Start a local web server:
   ```bash
   npm install
   npm start
   ```

4. Open `http://localhost:8000` in your browser

### Code Style

- Use consistent indentation (4 spaces)
- Add comments for complex logic
- Keep functions focused and single-purpose
- Use meaningful variable and function names
- Follow existing code patterns

### Making Changes

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes
3. Test thoroughly in different browsers and zoom levels
4. Commit with clear commit messages:
   ```bash
   git commit -m "Add feature: description of changes"
   ```

5. Push to your fork and create a Pull Request

## Reporting Issues

- Use GitHub Issues to report bugs
- Include browser/OS information
- Describe steps to reproduce the issue
- Attach screenshots if applicable

## Feature Requests

- Discuss major features as GitHub Issues first
- Provide clear use cases and benefits
- Consider compatibility with existing features

## Documentation

- Update README.md for user-facing changes
- Add code comments for complex logic
- Include examples for new features

## Performance Considerations

When contributing code:
- Test with large datasets (1000+ markers)
- Consider mobile device performance
- Minimize bundle size
- Avoid blocking operations

## Testing

Test your changes:
- Multiple browsers (Chrome, Firefox, Safari, Edge)
- Different zoom levels (1-19)
- Mobile devices and tablets
- Different map areas

## License

By contributing, you agree that your contributions will be licensed under the ODbL-1.0 license (same as OpenStreetMap data).
