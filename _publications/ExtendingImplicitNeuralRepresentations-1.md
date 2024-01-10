---
title: "Extending Implicit Neural Representations for Text-to-Image Generation"
collection: publications
permalink: /publication/ExtendingImplicitNeuralRepresentations-1
excerpt: '**Guanming Liu**, Zhihua Wei, et al'
date: 2024-3-15
venue: 'ICASSP'
image: /images/EIDGAN.png
order: 1
abstract: "Implicit neural representations (INRs) have demonstrated their effectiveness in continuous modeling for image signals. However, INRs typically operate in a continuous space, which makes it difficult to integrate the discrete symbols and structures inherent in human language. Despite this, text features carry rich semantic information that is helpful for visual representations, alleviating the demand of INR-based generative models for improvement in diverse datasets. To this end, we propose EIDGAN, an Efficient scale-Invariant Dual-modulated generative adversarial network, extending INRs for text-to-image generation while balancing network's representation power and computation costs. The spectral modulation utilizes Fourier transform to introduce global sentence information into the channel-wise frequency domain of image features. The cross attention modulation, as second-order polynomials incorporating the style codes, introduces local word information while recursively increasing the expressivity of a synthesis network. Benefiting from the column-row entangled bi-line design, EIDGAN enables text-guided generation of any-scale images and semantic extrapolation beyond image boundaries. We conduct experiments on text-to-image tasks based on MS-COCO and CUB datasets, demonstrating competitive performance on INR-based methods."

# description: 'It explores the relationship between the frequency domain representation of continuous image signals and the discrete textual features using the CLIP model. Specifically, we employ the StyleGAN architecture and introduce innovative techniques such as frequency modulation and cross-attention modulation to incorporate the features of sentences and words. As an INR-based GAN, our model exhibits characteristics such as extrapolation beyond image boundaries and arbitrary image resolution generation.'
# paperurl: 'http://academicpages.github.io/files/paper1.pdf'
# citation: 'Your Name, You. (2009). &quot;Paper Title Number 1.&quot; <i>Journal 1</i>. 1(1).'
# Description
# [Description] It explores the relationship between the frequency domain representation of continuous image signals and the discrete textual features using the CLIP model. Specifically, we employ the StyleGAN architecture and introduce innovative techniques such as frequency modulation and cross-attention modulation to incorporate the features of sentences and words. As an INR-based GAN, our model exhibits characteristics such as extrapolation beyond image boundaries and arbitrary image resolution generation.
---



<div style="border: 1px solid #ccc; padding: 8px; margin-bottom: 20px;">
  <img src="/images/EIDGAN.png" alt="EIDGAN">
  <br>
  <p style="margin-top: 10px;margin-bottom: 5px;"> 
  <strong>EIDGAN architecture overview. </strong> <br style="margin-bottom: 10px;"> The mapping network incorporates global and local text features with latent codes. The synthesis network, which employs a thick bi-line representation to improve memory-efficiency, incorporates proposed dual modulation mechanism, which effectively regulates the pixel features of semantics and frequency components.</p>
</div>

<div style="border: 1px solid #ccc; padding: 8px; margin-bottom: 20px;">
  <img src="/images/Extrapolation and interpolation results.png" alt="Results">
  <br>
  <p style="margin-top: 10px;margin-bottom: 5px;"> <strong>Beyond-boundary extrapolation and Scale-consistent interpolation outputs.</strong> We only train models at a 256 × 256 setting.</p>
</div>

<!-- This paper is about the number 1. The number 2 is left for future work. -->

[Download paper here](http://landian60.github.io/files/icassp24_ming_final.pdf)

<!-- Recommended citation: Your Name, You. (2009). "Paper Title Number 1." <i>Journal 1</i>. 1(1). -->
