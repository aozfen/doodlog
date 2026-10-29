Pod::Spec.new do |s|
  s.name           = 'Cutout'
  s.version        = '1.0.0'
  s.summary        = 'Removes the background of a drawing with Apple Vision.'
  s.author         = ''
  s.homepage       = 'https://doodlog.app'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
