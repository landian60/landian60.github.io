---
title: "Training-free NAS for 3D Point Cloud Processing"
collection: publications
permalink: /publication/Training-freeNAS-3
excerpt: 'Ping Zhao, Panyue Chen, **Guanming Liu**'
date: 2022-10-1
venue: 'ACCV'
image: /images/training_free.jpg
order: 3
abstract: "Deep neural networks for 3D point cloud processing have exhibited superior performance on many tasks. However, the structure and computational complexity of existing networks are relatively fixed, which makes it difficult for them to be flexibly applied to devices with different computational constraints. Instead of manually designing the network structure for each specific device, in this paper, we propose a novel training-free neural architecture search algorithm which can quickly sample network structures that satisfy the computational constraints of various devices. Specifically, we design a cell-based search space that contains a large number of latent network structures. The computational complexity of these structures varies within a wide range to meet the needs of different devices. We also propose a multi-objective evolutionary search algorithm. This algorithm scores the candidate network structures in the search space based on multiple training-free proxies, encourages high-scoring networks to evolve, and gradually eliminates low-scoring networks, so as to search for the optimal network structure. Because the calculation of training-free proxies is very efficient, the whole algorithm can be completed in a short time. Experiments on 3D point cloud classification and part segmentation demonstrate the effectiveness of our method"
# paperurl: 'http://academicpages.github.io/files/paper2.pdf'
# citation: 'Your Name, You. (2010). &quot;Paper Title Number 2.&quot; <i>Journal 1</i>. 1(2).'
---
<!-- This paper is about the number 2. The number 3 is left for future work. -->
<div style="border: 1px solid #ccc; padding: 8px; margin-bottom: 20px;">
  <img src="/images/training_free.jpg" alt="training_free">
</div>

[Download paper here](https://openaccess.thecvf.com/content/ACCV2022/papers/Zhao_Training-free_NAS_for_3D_Point_Cloud_Processing_ACCV_2022_paper.pdf)

<!-- Recommended citation: Your Name, You. (2010). "Paper Title Number 2." <i>Journal 1</i>. 1(2). -->